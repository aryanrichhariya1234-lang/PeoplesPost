import express from 'express';
import {
  busiestMonth,
  createTour,
  deleteTour,
  getTour,
  getTours,
  TourAggregate,
  updateTour,
} from '../controllers/tourController.js';
import { protect, security } from '../controllers/userController.js';
import { storeMetaDataTour } from '../controllers/imageController.js';
import { createSession } from '../controllers/bookingsController.js';

export const tourRouter = express.Router();

// 1. PUBLIC ROUTES & STATS (No ID needed)
tourRouter.route('/').get(getTours);

tourRouter.route('/aggregate').get(TourAggregate);
tourRouter.route('/busiest/:year').get(busiestMonth);

// 2. PROTECTED ACTION ROUTES (Specific actions on an ID)
tourRouter.use(protect); // You can use middleware like this to protect everything below

tourRouter.route('/:id/image').post(storeMetaDataTour);
tourRouter.route('/:id/book').post(protect, createSession);
// 3. GENERIC CRUD ROUTES (Keep at the bottom)
tourRouter
  .route('/:id')
  .get(getTour)
  .patch(security('admin', 'lead-guide'), updateTour)
  .delete(security('admin', 'lead-guide'), deleteTour); // Fixed the security call

// 4. ADMIN ONLY ROUTES
tourRouter.route('/').post(security('admin', 'lead-guide'), createTour);
