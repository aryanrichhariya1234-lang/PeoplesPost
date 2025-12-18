import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  tour: { type: mongoose.Schema.ObjectId, ref: 'Tour' },
  user: { type: mongoose.Schema.ObjectId, ref: 'User' },
  price: Number,
  paid: Boolean,
});

export const Booking = mongoose.model('Booking', bookingSchema);
