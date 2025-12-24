/* eslint-disable no-undef */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});
import { app } from './app.js';

mongoose.connect(process.env.DATABASE_URL).then(() => {
  console.log('Access to database secured');
});

const server = app.listen(process.env.PORT, () => {
  console.log('server is running');
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});
