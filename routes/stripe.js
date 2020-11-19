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
    const commerceId = req.body.commerceId;
    console.log(`create-checkout-session Body ${commerceId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        { price: process.env.PRICE, quantity: 1 },
      ],
      mode: 'payment',
      success_url: `${process.env.ROOT_SERVER_URL}/user?session_id={CHECKOUT_SESSION_ID}&commerce_id=${commerceId}`,
      cancel_url: `${process.env.ROOT_SERVER_URL}/user`,
    });

    res.json({ id: session.id });
  });

  app.post('/retrieve-checkout-session-status', async (req, res) => {
    const checkoutId = req.body.checkout.id;
    console.log(`create-checkout-session Body ${checkoutId}`);

    const session = await stripe.checkout.sessions.retrieve(`${checkoutId}`);

    if (session.object === 'checkout.session') {
      // Check this for result of payment (enum: paid || unpaid || no_payment_required)
      res.json({ payment_status: session.payment_status });  
    } else {
      res.status(400).json({message: "Invalid id, not returning a session object"});
    }
  });

}