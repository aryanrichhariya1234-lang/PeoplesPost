import JWT from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { HandleError } from '../helpers/error.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { catchAsync } from '../helpers/helperFunctions.js';
import { Post } from '../models/postModel.js';

export const signUp = catchAsync(async (req, res) => {
  const user = await User.create({
    name: req.body.name,
    passwordConfirm: req.body.passwordConfirm,
    password: req.body.password,
    email: req.body.email,
    role: req.body.role,
    governmentId: req.body.governmentId,
  });

  const token = JWT.sign({ id: user._id }, process.env.SECRET, {
    expiresIn: '10d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });

  res.json({
    status: 'success',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new HandleError(400, 'Please enter email and password'));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new HandleError(401, 'User not found'));
  }

  const isPasswordSame = await bcrypt.compare(password, user.password);

  if (!isPasswordSame) {
    return next(new HandleError(401, 'Incorrect password'));
  }

  const token = JWT.sign({ id: user._id }, process.env.SECRET, {
    expiresIn: '10d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });

  res.json({ status: 'success', token });
});

export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new HandleError(401, 'Please log in'));
  }

  const decoded = JWT.verify(token, process.env.SECRET);

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new HandleError(401, 'User no longer exists'));
  }

  const isChanged = await user.checkPasswordChanged(decoded.iat);

  if (isChanged) {
    return next(new HandleError(401, 'Password changed. Login again'));
  }

  req.user = user;
  next();
});

export const security = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new HandleError(403, 'Not authorized'));
    }
    next();
  };
};

export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: true,
    sameSite: 'none',
    path: '/',
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

export const getMe = async (req, res) => {
  const reports = await Post.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: 'success',
    user: req.user,
    data: reports,
  });
};

export const updateMe = async (req, res) => {
  const fields = ['name', 'email'];
  let object = {};

  fields.forEach((item) => (object[item] = req.body[item]));

  const update = await User.findByIdAndUpdate(req.user._id, object, {
    new: true,
    runValidators: true,
  });

  res.json({ status: 'success', update });
};

export const deleteMe = async (req, res) => {
  await User.deleteOne({ _id: req.user._id });

  res.json({ status: 'success' });
};

export const updatePassword = async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isCorrect = await bcrypt.compare(currentPassword, user.password);

  if (!isCorrect) {
    return next(new HandleError(401, 'Incorrect current password'));
  }

  if (password !== passwordConfirm) {
    return next(new HandleError(400, 'Passwords do not match'));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;

  await user.save();

  const token = JWT.sign({ id: user._id }, process.env.SECRET, {
    expiresIn: '10d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });

  res.json({
    status: 'success',
    message: 'Password updated',
  });
};

export const forgotPassword = async (req, res, next) => {
  const email = req.body.email;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new HandleError(400, 'No user found with that email'));
  }

  const token = crypto.randomBytes(12).toString('hex');

  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  user.passwordResetTime = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  res.json({ status: 'success', message: 'Token sent' });
};

export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  const passwordResetTokenNew = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: passwordResetTokenNew,
  });

  if (!user) {
    return next(new HandleError(400, 'Invalid token'));
  }

  if (Date.now() > user.passwordResetTime) {
    return next(new HandleError(400, 'Token expired'));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTime = undefined;

  await user.save();

  const tokenNew = JWT.sign({ id: user._id }, process.env.SECRET, {
    expiresIn: '10d',
  });

  res.json({ status: 'success', token: tokenNew });
};
