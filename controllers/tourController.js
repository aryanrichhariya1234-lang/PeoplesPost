import { HandleError } from '../helpers/error.js';
import { TourClass } from '../helpers/tourClass.js';
import { Tour } from '../models/tourModel.js';

export function catchAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
export const checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.json({
      status: 'fail',
      message: 'Please enter name and price property',
    });
  }
  next();
};

export const getTours = catchAsync(async (req, res) => {
  let query = Tour.find();
  let newQuery = new TourClass(req.query, query);
  newQuery = newQuery.filter().sort().paginate().selecting().query;
  const tours = await newQuery;

  res
    .status(200)
    .json({ status: 'success', length: tours.length, data: tours });
});

export const getTour = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const tour = await Tour.find({ _id: id }).populate('reviews');
  if (!tour) next(new HandleError(404, 'No tour found with that id'));
  res.status(200).json({ status: 'success', data: tour });
});

export const createTour = catchAsync(async (req, res) => {
  const tour = req.body;

  const data = await Tour.create(tour);

  res.status(200).json({ status: 'success', data });
});

export const updateTour = catchAsync(async (req, res) => {
  const id = req.params.id;
  const updatedBody = req.body;

  const updatedTour = await Tour.findByIdAndUpdate(id, updatedBody, {
    runValidators: true,
  });
  res.json({ status: 'success', data: updatedTour });
});

export const deleteTour = catchAsync(async (req, res) => {
  const id = req.params;
  const data = await Tour.findByIdAndDelete(id);
  res.status(200).json({ status: 'success', data });
});

export const TourAggregate = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: '$difficulty',
        avgRating: { $avg: '$ratingsAverage' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgRating: 1 },
    },
    {
      $match: {
        _id: { $ne: 'easy' },
      },
    },
  ]);
  res.json({ status: 'success', data: stats });
});

export const busiestMonth = catchAsync(async (req, res) => {
  const year = Number(req.params.year);
  const stats = await Tour.aggregate([
    { $unwind: '$startDates' },
    { $project: { startDates: 1 } },
    {
      $addFields: {
        month: { $month: '$startDates' },
        year: { $year: '$startDates' },
      },
    },
    { $match: { year: { $eq: year } } },
    { $group: { _id: '$month', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ status: 'success', data: stats });
});
