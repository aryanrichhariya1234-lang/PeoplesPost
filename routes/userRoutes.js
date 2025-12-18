import express from 'express';
import {
  deleteMe,
  forgotPassword,
  login,
  protect,
  resetPassword,
  signUp,
  updateMe,
  updatePassword,
} from '../controllers/userController.js';
import { storeMetaDataUser } from '../controllers/imageController.js';

export const userRouter = express.Router();

userRouter.get('/', (req, res) => {
  res.json({ status: 'success', data: 'data' });
});
userRouter.post('/image', protect, storeMetaDataUser);
userRouter.post('/forgotPassword', forgotPassword);
userRouter.patch('/updateMe', protect, updateMe);
userRouter.post('/updatePassword', protect, updatePassword);
userRouter.post('/signup', signUp);
userRouter.post('/login', login);
userRouter.delete('/deleteMe', protect, deleteMe);
userRouter.post('/resetPassword/:token', resetPassword);
