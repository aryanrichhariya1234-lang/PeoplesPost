import mongoose from 'mongoose';
import validator from 'validator';

import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxLength: 20,
    required: [true, 'User must have a name'],
  },
  password: { type: String, select: false },
  passwordChangedAt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetTime: { type: Date },
  email: {
    type: String,
    validate: {
      validator: validator.isEmail,
      message: 'Please enter valid email',
    },
    unique: true,
  },
  role: {
    type: String,
    enum: ['citizen', 'official'],

    required: true,
  },
  governmentId: {
    type: String,
    required: function () {
      return this.role === 'official';
    },
  },
  active: { type: Boolean },
  photo: String,
  public_id: String,
  passwordConfirm: {
    type: String,
    validate: {
      validator: function (val) {
        return this.password === val;
      },
    },
    // required: true,
  },
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const dbPassword = await bcrypt.hash(this.password, 12);
  this.password = dbPassword;
  this.passwordConfirm = undefined;
});
userSchema.pre('save', async function () {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
  return;
});

userSchema.methods.checkPasswordChanged = async function (iat) {
  if (!this.passwordChangedAt) {
    return false;
  }

  const passwordChangedTimestamp = Math.floor(
    this.passwordChangedAt.getTime() / 1000
  );

  return iat < passwordChangedTimestamp;
};

export const User = mongoose.model('User', userSchema);
