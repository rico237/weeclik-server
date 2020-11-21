module.exports = function(app){

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  app.post('/create-checkout-session', async (req, res) => {
    const commerceId = req.body.commerceId;
    console.log(`create-checkout-session Body commerceId: ${commerceId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        { price: process.env.PRICE, quantity: 1 },
      ],
      mode: 'payment',
      // success_url: `${process.env.WEB_URL}/success-checkout?session_id={CHECKOUT_SESSION_ID}&commerce_id=${commerceId}`,
      success_url: `${process.env.WEB_URL}/success-checkout/{CHECKOUT_SESSION_ID}/${commerceId}`,
      cancel_url: `${process.env.WEB_URL}/aboutcommerce/${commerceId}`,
    });

    res.json({ id: session.id });
  });

  app.post('/retrieve-checkout-session-status', async (req, res) => {
    const checkoutId = req.body.checkoutId;
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