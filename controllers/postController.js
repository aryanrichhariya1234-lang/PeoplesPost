import { redis } from '../config/redis.js';
import { catchAsync } from '../helpers/helperFunctions.js';
import { Post } from '../models/postModel.js';

export const createPost = catchAsync(async (req, res, next) => {
  const { category, Address, description, location } = req.body;

  if (!category || !Address || !description || !location) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide all required fields',
    });
  }

  const imageUrls = req.files.map((file) => file.path);

  const post = await Post.create({
    user: req.user.id,
    category,
    Address,
    description,
    images: imageUrls,
    location,
  });

  await redis.del('posts');
  await redis.del('dashboard:insights');
  res.status(201).json({
    status: 'success',
    data: post,
  });
});

export const getAllPosts = catchAsync(async (req, res, next) => {
  const cachedPosts = await redis.get('posts');

  if (cachedPosts) {
    return res.status(200).json({
      status: 'success',
      data: cachedPosts,
    });
  }

  // 2. Fetch from DB
  const posts = await Post.find()
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  // 3. Store in cache (TTL = 30 mins)
  await redis.set('posts', posts, { ex: 1800 });

  res.status(200).json({
    status: 'success',
    data: posts,
  });
});

export const updatePost = catchAsync(async (req, res, next) => {
  const { description, images, location, status } = req.body;

  let post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ msg: 'Post not found' });
  }

  // ✅ FIX: allow owner OR official
  if (post.user.toString() !== req.user.id && req.user.role !== 'official') {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  // ✅ update fields safely
  if (description !== undefined) post.description = description;
  if (images !== undefined) post.images = images;
  if (status !== undefined) post.status = status;

  if (location !== undefined) {
    post.location = location;
  }
  console.log('data');
  try {
    await post.save();
    await redis.del('posts');
    await redis.del('dashboard:insights');
  } catch (err) {
    console.log(err);
  }
  res.status(200).json({
    status: 'success',
    data: post,
  });
});

export const deletePost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ msg: 'Post not found' });
  }

  if (post.user.toString() !== req.user.id) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  await post.deleteOne();

  res.json({ msg: 'Post removed successfully' });
});

export const toggleLike = async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const userId = req.user.id;

  const alreadyLiked = post.likes.some(
    (like) => like.user.toString() === userId
  );

  if (alreadyLiked) {
    // ❌ REMOVE LIKE
    post.likes = post.likes.filter((like) => like.user.toString() !== userId);
  } else {
    // ✅ ADD LIKE
    post.likes.push({ user: userId });
  }

  await post.save();
  await redis.del('posts');
  await redis.del('dashboard:insights');
  res.status(200).json({
    status: 'success',
    liked: !alreadyLiked,
    likesCount: post.likes.length,
  });
};
