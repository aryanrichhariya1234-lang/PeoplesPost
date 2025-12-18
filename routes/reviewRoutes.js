import express from 'express';
import {
  createReview,
  getAllReviews,
  updateReview,
} from '../controllers/reviewController.js';
import { protect, security } from '../controllers/userController.js';

export const reviewRouter = express.Router();
reviewRouter.use(protect);
reviewRouter.get('/', getAllReviews);
reviewRouter.post('/', security('user'), createReview);
reviewRouter.patch('/:id', protect, updateReview);
