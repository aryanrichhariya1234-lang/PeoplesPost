import express from 'express';
import {
  createPost,
  getAllPosts,
  toggleLike,
  updatePost,
} from '../controllers/postController.js';
import { protect } from '../controllers/userController.js';
import { upload } from './upload.js';

export const postRouter = express.Router();

postRouter.get('/', getAllPosts);
postRouter.post('/', protect, upload.array('images', 5), createPost);
postRouter.post('/:id/like', protect, toggleLike);
postRouter.patch('/:id', protect, updatePost);
