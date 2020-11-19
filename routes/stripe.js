module.exports = function(app){

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  app.post("/charge", (req, res) => {    
    if (req.body.object === 'event') {
      console.log("event object missing abording request")
      return;
    }

    stripe.charges.create({
      amount: process.env.ABONNEMENT_PRICE_ONE_YEAR,
      currency: "eur",
      description: "Abonnement annuel d'un commerce sur Weeclik (web)",
      source: req.body.token.id
    }).then(response => {
      res.json({ok: true, message: 'success', response: response});
    }).catch(error => {
      const message = error.type + ' : ' + error.message;
      console.log(message);
      switch (error.type) {
        case 'StripeCardError':
              // A declined card error
              error.message; // => e.g. "Your card's expiration year is invalid."
              break;
              case 'StripeInvalidRequestError':
              error.message;
              // Invalid parameters were supplied to Stripe's API
              break;
              case 'StripeAPIError':
              // An error occurred internally with Stripe's API
              break;
              case 'StripeConnectionError':
              // Some kind of error occurred during the HTTPS communication
              break;
              case 'StripeAuthenticationError':
              // You probably used an incorrect API key
              break;
              case 'StripeRateLimitError':
              // Too many requests hit the API too quickly
              break;
            }
            res.status(500).json({ok: false, message: 'error', response: message});
          });
  });

  app.post('/create-checkout-session', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        { price: process.env.PRICE, quantity: 1 },
      ],
      mode: 'payment',
      success_url: process.env.ROOT_SERVER_URL + '/' + 'user',
      cancel_url: process.env.ROOT_SERVER_URL + '/' + 'user',
    });

    res.json({ id: session.id });
  });

  // Webhook handler for asynchronous events.
  app.post('/stripe-response-webhook', async (req, res) => {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let signature = req.headers['stripe-signature'];

      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`);
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      data = event.data;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data;
      eventType = req.body.type;
    }

    if (eventType === 'checkout.session.completed') {
      console.log(`🔔  Payment received!`);
    }

    res.sendStatus(200);
  });

}