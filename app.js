/* eslint-disable no-undef */
import express from 'express';
import rateLimit from 'express-rate-limit';
import { xss } from 'express-xss-sanitizer';
import helmet from 'helmet';
import morgan from 'morgan';
import { HandleError } from './helpers/error.js';
import cors from 'cors';
import { userRouter } from './routes/userRoutes.js';
import aiRouter from './routes/aiRoutes.js';
import hpp from 'hpp';

import { postRouter } from './routes/postRoutes.js';
import cookieParser from 'cookie-parser';

export const app = express();
app.use(helmet());
// app.use(ExpressMongoSanitize());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(
  cors({
    origin: 'https://peoplepost-3qzx.vercel.app',
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
const limiter = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from one user.Please try again after 1 hour',
});
app.use(limiter);
app.set('trust proxy', 1);
app.use(xss());
app.use(
  hpp({
    whitelist: ['difficulty', 'price', 'duration'],
  })
);
app.use(express.static('./public'));
app.get('/loaderio-9bc341a1e70db16b8457e4fe2ef54b3f', (req, res) => {
  res.send('loaderio-9bc341a1e70db16b8457e4fe2ef54b3f');
});
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);

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
