/* eslint-disable no-undef */
import express from 'express';
import { tourRouter } from './routes/tourRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { HandleError } from './helpers/error.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import { xss } from 'express-xss-sanitizer';

import hpp from 'hpp';
import { reviewRouter } from './routes/reviewRoutes.js';
import { ImageRouter } from './routes/upload.js';
import { webhookCheckout } from './controllers/bookingsController.js';
dotenv.config({ path: './.env.local' });

export const app = express();

function sanitizeReqBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = ExpressMongoSanitize.sanitize(req.body);
  }
  next();
}
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
const limiter = rateLimit({
  limit: 100000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from one user.Please try again after 1 hour',
});
app.use(limiter);
app.use(sanitizeReqBody);

app.use(xss());
app.use(hpp());
app.use(express.static('./public'));
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/upload', ImageRouter);
app.use((req, res, next) => {
  const err = new HandleError(
    404,
    'Cannot find this url.Please go to Homepage'
  );

  next(err);
});
function handleProductionError(error, res) {
  if (error.isOperational) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
      data: {
        status: error.status,
        message: error.message,
      },
    });
  } else {
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
}
app.use((err, req, res, next) => {
  let error = Object.assign(err);

  // if (err.name === 'MongoServerError') {
  //   const message = err.name;
  //   return new HandleError(400, message);
  // }
  if (process.env.NODE_ENV === 'production') {
    if (error.name === 'CastError') {
      const message = `For this ${error.path} we have invalid id ,${error.value}`;
      error = new HandleError(400, message);
    }
    if (error.name === 'ValidationError') {
      const errors = error.errors;
      const errorsMessages = Object.keys(errors).map(
        (item) => errors[item].message
      );

      error = new HandleError(400, errorsMessages.join('.'));
    }
    if (error.code === 11000) {
      const message = 'Duplicate property found';
      error = new HandleError(400, message);
    }
    handleProductionError(error, res);
  } else if (process.env.NODE_ENV === 'development') {
    res
      .status(400)
      .json({ status: 'fail', message: error.message, data: error });
  }
});
