import mongoose from 'mongoose';
import { Tour } from './tourModel.js';

const reviewSchema = new mongoose.Schema({
  review: { type: String, required: [true, 'review is required '] },
  createdAt: { type: Date, default: Date.now },

  rating: { type: Number, min: 1, max: 5 },
  user: { type: mongoose.Schema.ObjectId, required: true, ref: 'User' },
  tour: { type: mongoose.Schema.ObjectId, required: true, ref: 'Tour' },
});

reviewSchema.statics.calcAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        ratings: { $avg: '$rating' },
        numberOfRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numberOfRatings,
      ratingsAverage: stats[0].ratings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, // default
    });
  }
};
reviewSchema.pre(/^findOneAnd/, async function () {
  this.r = await this.model.findOne(this.getQuery());
});
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRating(this.r.tour);
});

reviewSchema.post('save', async function () {
  this.constructor.calcAverageRating(this.tour);
});

reviewSchema.pre(/^find/, function () {
  // this.populate('user').populate('tour');
  this.populate('user');
});

export const Review = mongoose.model('Review', reviewSchema);
