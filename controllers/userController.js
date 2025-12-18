import JWT from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { catchAsync } from './tourController.js';
import { HandleError } from '../helpers/error.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { sendEmail } from './email.js';
export const signUp = catchAsync(async (req, res) => {
  const user = await User.create({
    name: req.body.name,
    passwordConfirm: req.body.passwordConfirm,
    password: req.body.password,
    email: req.body.email,
  });
  const payload = { id: user._id };

  const token = JWT.sign(payload, process.env.SECRET, { expiresIn: '10d' });
  res.json({ status: 'success', token: token });
});

export const login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return next(new HandleError(400, 'Please enter email and password'));
  }
  const user = await User.findOne({ email }).select('+password ');
  if (!user) {
    return next(new HandleError(400, 'Cannot find user with that email'));
  }

  const isPasswordSame = await bcrypt.compare(password, user.password);
  if (!isPasswordSame) {
    return next(
      new HandleError(400, 'Incorrect password.Please enter correct password')
    );
  }
  const token = JWT.sign({ id: user._id }, process.env.SECRET, {
    expiresIn: '10d',
  });

  res.json({ status: 'success', token });
});

export const protect = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return next(new HandleError(400, 'Please log in to continue'));
  }
  const decoded = JWT.verify(token, process.env.SECRET);

  const user = await User.findOne({ _id: decoded.id });
  if (!user) {
    return next(new HandleError(400, 'User does not exist'));
  }
  const isPassWordChanged = await user.checkPasswordChanged(decoded.iat);
  if (isPassWordChanged) {
    return next(
      new HandleError(
        400,
        'Passsword changed .Please enter new password or reset if u forgot'
      )
    );
  }
  req.user = user;
  next();
});

export const security = (...roles) => {
  return async (req, res, next) => {
    const role = req.user.role;

    if (!roles.includes(role)) {
      return next(
        new HandleError(400, 'Your are not authorized to perform this action')
      );
    }
    next();
  };
};

export const forgotPassword = async (req, res, next) => {
  const email = req.body.email;
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new HandleError(400, 'No user found with that email.Please signup')
    );
  }
  const token = crypto.randomBytes(12).toString('hex');
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  user.passwordResetTime = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${token}`;
  await sendEmail({
    email: user.email,
    subject: `Your password reset token ${token} Valid for 10mins `,
    link: resetUrl,
  });
  res.json({ status: 'success', message: 'Token sent to email' });
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
  if (passwordResetTokenNew !== user.passwordResetToken) {
    return next(new HandleError(400, 'Incorrect token'));
  }

  if (!user) {
    return next(new HandleError(400, 'User does not exist'));
  }
  if (Date.now() > user.passwordResetTime) {
    return next(new HandleError(400, 'Token expired .Please resend the email'));
  }
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTime = undefined;
  await user.save();
  const tokenNew = JWT.sign({ id: user._id }, process.env.SECRET, {
    expiresIn: '10d',
  });

  res.json({ status: 'success', message: 'User updated', token: tokenNew });
};

export const updatePassword = async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;

  const user = await User.findOne({ _id: req.user.id }).select('+password');

  const isCorrect = await bcrypt.compare(currentPassword, user.password);

  if (!isCorrect) {
    return next(new HandleError(400, 'Incorrect current password'));
  }
  if (password !== passwordConfirm)
    return next(
      new HandleError(400, 'Password and currentPassword should be same')
    );
  user.password = password;
  user.passwordConfirm = undefined;
  await user.save({ validateBeforeSave: false });
  const tokenNew = JWT.sign({ id: user._id }, process.env.SECRET, {
    expiresIn: '10d',
  });
  res.cookie('jwt', tokenNew, {
    expires: Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    secure: true,
    httpOnly: true,
  });
  res.json({ status: 'success', message: 'User updated', token: tokenNew });
};

export const updateMe = async (req, res) => {
  const user = await User.findOne({ _id: req.user.id });
  const fields = ['name', 'email'];
  let object = {};
  fields.forEach((item) => (object[item] = req.body[item]));

  const update = await User.findByIdAndUpdate({ _id: user._id }, object, {
    new: true,
    runValidators: true,
  });
  res.json({ status: 'success', update });
};

export const deleteMe = async (req, res) => {
  const user = await User.deleteOne({ _id: req.user.id });
  res.json({ status: 'success', user });
};
