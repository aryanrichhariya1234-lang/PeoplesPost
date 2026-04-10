import mongoose from 'mongoose';
const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Pothole',
        'Streetlight',
        'Other',
        'Garbage',
        'Garbage dump',
        'Sanitation and Waste',
        'Road and Transport',
        'Water and Drainage',
        'Public Safety',
        'Garbage vehicle not arrived',
        'Dustbins not cleaned',
        'Sweeping',
        'Dead animals',
        'Public toilet(s) cleaning',
      ],
      required: true,
    },
    Address: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    images: [
      {
        type: String,
      },
    ],

    location: {
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },

    status: {
      type: String,
      enum: ['OPEN', 'IN_PROCESS', 'RESOLVED'],
      default: 'OPEN',
    },

    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model('Post', postSchema);
