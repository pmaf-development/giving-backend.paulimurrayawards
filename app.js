import express from 'express';
import stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({
  path: './.env.sandbox'
})

const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  maxNetworkRetries: 3,
});

const dynamicCorsOptions = (_, callback) => {
  const _options = {
    origin: [
      "https://giving.paulimurrayawards.com",
      "https://giving-staging.paulimurrayawards.com",
      "https://localhost:3000",
    ],
  };
  callback(null, corsOptions);
};


const app = express();
app.use(cors(dynamicCorsOptions));

app.post('/donate/create-checkout-session', async (_, res) => {
  const session = await stripeInstance.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [
      {
        // Provide the exact Price ID (e.g. price_1234) of the product you want to sell
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: 'payment',
    redirect_on_completion: 'never',
  });

  res.send({ clientSecret: session.client_secret });
});

app.get('/donate/session-status', async (req, res) => {
  const session = await stripeInstance.checkout.sessions.retrieve(
    req.query.session_id,
  );

  // we have a valid session
  if (
    session.payment_intent !== null &&
    typeof session.payment_intent !== 'string'
  ) {
    res.send({
      status: session.status,
      payment_status: session.payment_status,
      payment_intent_id: session.payment_intent.id,
      payment_intent_status: session.payment_intent.status,
    });
  }
});

app.listen(app, process.env.SERVER_PORT, () =>
  console.log('Server is listening...'),
);