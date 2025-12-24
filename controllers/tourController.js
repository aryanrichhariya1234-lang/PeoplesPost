import { HandleError } from '../helpers/error.js';
import { TourClass } from '../helpers/tourClass.js';
import { Tour } from '../models/tourModel.js';
import redis from '../redisClient.js';

export function catchAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
export const checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.json({
      status: 'fail',
      message: 'Please enter name and price property',
    });
  }
  next();
};

export const getTours = catchAsync(async (req, res) => {
  const cacheKey = `tours:all`;

  if (redis) {
    const cachedTours = await redis.get(cacheKey);
    if (cachedTours) {
      return res.status(200).json({
        status: 'success',
        source: 'cache',
        data: JSON.parse(cachedTours),
      });
    }
  }

  let query = Tour.find();
  let newQuery = new TourClass(req.query, query);
  newQuery = newQuery.filter().sort().paginate().selecting().query;

  const tours = await newQuery;

  if (redis) {
    await redis.set(cacheKey, JSON.stringify(tours), 'EX', 60);
  }

  res.status(200).json({
    status: 'success',
    source: 'db',
    length: tours.length,
    data: tours,
  });
});

export const getTour = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const tour = await Tour.find({ _id: id }).populate('reviews');
  if (!tour) next(new HandleError(404, 'No tour found with that id'));
  res.status(200).json({ status: 'success', data: tour });
});

export const createTour = catchAsync(async (req, res) => {
  const tour = req.body;

  const data = await Tour.create(tour);
  if (redis) {
    const keys = await redis.keys('tours:*');
    if (keys.length) await redis.del(keys);
  }

  res.status(200).json({ status: 'success', data });
});

export const updateTour = catchAsync(async (req, res) => {
  const id = req.params.id;
  const updatedBody = req.body;
  if (redis) {
    const keys = await redis.keys('tours:*');
    if (keys.length) await redis.del(keys);
  }

  const updatedTour = await Tour.findByIdAndUpdate(id, updatedBody, {
    runValidators: true,
  });

  res.json({ status: 'success', data: updatedTour });
});

export const deleteTour = catchAsync(async (req, res) => {
  const id = req.params;
  if (redis) {
    const keys = await redis.keys('tours:*');
    if (keys.length) await redis.del(keys);
  }
  const data = await Tour.findByIdAndDelete(id);
  res.status(200).json({ status: 'success', data });
});

export const TourAggregate = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: '$difficulty',
        avgRating: { $avg: '$ratingsAverage' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgRating: 1 },
    },
    {
      $match: {
        _id: { $ne: 'easy' },
      },
    },
  ]);
  res.json({ status: 'success', data: stats });
});

export const busiestMonth = catchAsync(async (req, res) => {
  const year = Number(req.params.year);
  const stats = await Tour.aggregate([
    { $unwind: '$startDates' },
    { $project: { startDates: 1 } },
    {
      $addFields: {
        month: { $month: '$startDates' },
        year: { $year: '$startDates' },
      },
    },
    { $match: { year: { $eq: year } } },
    { $group: { _id: '$month', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ status: 'success', data: stats });
});
