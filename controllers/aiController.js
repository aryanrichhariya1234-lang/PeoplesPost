import { GoogleGenAI } from '@google/genai';
import { Post } from '../models/postModel.js';
import { redis } from '../config/redis.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const getDashboardInsights = async (req, res) => {
  try {
    const CACHE_KEY = 'dashboard:insights';

    const cached = await redis.get(CACHE_KEY);

    if (cached) {
      return res.json(cached);
    }

    const cityStats = await Post.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const categoryStats = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const userStats = await Post.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const now = new Date();

    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 7);

    const prev7Days = new Date(now);
    prev7Days.setDate(now.getDate() - 14);

    const currentWeek = await Post.countDocuments({
      createdAt: { $gte: last7Days },
    });

    const previousWeek = await Post.countDocuments({
      createdAt: { $gte: prev7Days, $lt: last7Days },
    });

    const trend =
      previousWeek === 0
        ? 100
        : ((currentWeek - previousWeek) / previousWeek) * 100;

    const totalReports = await Post.countDocuments();
    const estimatedImpact = totalReports * 50;

    let priority = 'LOW';
    if (trend > 30 || totalReports > 20) priority = 'HIGH';
    else if (trend > 10) priority = 'MEDIUM';

    const prompt = `
You are a smart city decision intelligence system.

Give:
1. Most affected city
2. Most common issue
3. Most active reporter
4. Trend (with %)
5. Priority level
6. Estimated people affected
7. Action recommendation

City Stats: ${JSON.stringify(cityStats)}
Category Stats: ${JSON.stringify(categoryStats)}
User Stats: ${JSON.stringify(userStats)}

Trend: ${trend.toFixed(2)}%
Total Reports: ${totalReports}
Impact: ${estimatedImpact}
Priority: ${priority}
`;

    let insights = 'AI unavailable';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      insights = response.text;
    } catch (err) {
      console.log('AI failed:', err.message);
    }

    const result = {
      status: 'success',
      insights,
      meta: {
        totalReports,
        trend,
        priority,
        estimatedImpact,
      },
    };

    await redis.set(CACHE_KEY, result, { ex: 900 }); // 15 min

    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate insights',
    });
  }
};
