import { Review } from '../models/reviewModel.js';
import { catchAsync } from './tourController.js';

export const getAllReviews = async (req, res) => {
  const reviews = await Review.find();
  res.json({ status: 'success', length: reviews.length, reviews });
};

export const createReview = catchAsync(async (req, res) => {
  const data = req.body;
  const review = await Review.create(data);
  res.json({ status: 'success', review });
});

export const updateReview = catchAsync(async (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const data1 = await Review.findByIdAndUpdate(id, data, {
    new: true,
  });
  res.json({ status: 'success', data1 });
});
