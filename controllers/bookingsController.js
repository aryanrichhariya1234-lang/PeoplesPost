import { HandleError } from '../helpers/error.js';
import { Booking } from '../models/bookingsModel.js';
import { Tour } from '../models/tourModel.js';
import { User } from '../models/userModel.js';
import { getStripe } from '../stripe.js';
import { catchAsync } from './tourController.js';

export const createSession = catchAsync(async (req, res) => {
  const tour = await Tour.findById(req.params.id);
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.host}`,
    cancel_url: `${req.protocol}://${req.host}/tour`,
    customer_email: req.user.email,
    client_reference_id: req.params.id,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: tour.name,
            description: tour.description,
          },
        },
        quantity: 1,
      },
    ],
  });
  res.status(200).json({ status: 'success', session });
});

const createBookingCheckout = async (session) => {
  const tourId = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email });

  const price = session.amount_total / 100;

  await Booking.create({
    tour: tourId,
    user: user.id,
    price,
  });
};

export const webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.WEBHOOK_SECRET
    );
  } catch (err) {
    return next(new HandleError(400, err.message));
  }
  if (event.type === 'checkout.session.completed') {
    await createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};
