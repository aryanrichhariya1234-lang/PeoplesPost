import Stripe from 'stripe';

export const getStripe = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};
