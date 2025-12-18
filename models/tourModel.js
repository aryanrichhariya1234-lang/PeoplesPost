import mongoose from 'mongoose';
import { User } from './userModel.js';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxLength: 25,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: { type: [Number] },
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: { type: [Number] },
        address: String,
        description: String,
        day: Number,
      },
    ],

    vip: Boolean,
    price: {
      type: Number,
      required: true,
    },
    ratingsAverage: { type: Number, min: 1, max: 5, default: 0 },
    duration: {
      type: Number,
    },
    maxGroupSize: Number,
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Values should be either easy,medium or difficult',
      },
    },
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    ratingsQuantity: { type: Number, default: 0 },
    summary: { type: String, trim: true },
    description: {
      type: String,
      required: [true, 'Tell us something about the tour'],
      trim: true,
    },
    imageCover: String,
    images: {
      type: [String],
    },
    url: String,
    public_id: String,
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Price discount should be less than price itself',
      },
    },
    createdAt: { type: Date, default: Date.now() },
    startDates: { type: [Date] },
  },

  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.pre('save', async function () {
  const guides = await User.find({ _id: { $in: this.guides } });
  this.guides = guides;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.pre(/^find/, async function () {
  this.populate('guides');
});

export const Tour = mongoose.model('Tour', tourSchema);
