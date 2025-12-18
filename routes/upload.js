import express from 'express';
import cloudinary from '../config/cloudinary.js';

export const ImageRouter = express.Router();

ImageRouter.get('/', (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: 'portfolio' },
    process.env.API_SECRET
  );
  res.json({
    timestamp,
    signature,
    api_key: process.env.API_KEY,
    cloudName: process.env.CLOUD_NAME,
  });
});
