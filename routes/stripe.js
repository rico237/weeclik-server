module.exports = function(app){

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    app.post('/create-checkout-session', async (req, res) => {
        const commerceId = req.body.commerceId;
        const userEmail = req.body.userEmail;

        try {
            const session = await stripe.checkout.sessions.create({
                customer_email: `${userEmail}`,
                payment_method_types: ['card'],
                line_items: [
                    { price: process.env.PRICE, quantity: 1 },
                ],
                mode: 'payment',
                success_url: `${process.env.WEB_URL}/success-checkout/{CHECKOUT_SESSION_ID}/${commerceId}`,
                cancel_url: `${process.env.WEB_URL}/aboutcommerce/${commerceId}`,
                metadata: {
                    'commerce_id': `${commerceId}`,
                    'customer_email': `${userEmail}`
                },
            });

            res.json({ id: session.id });
        } catch (error) {
            res.status(400).json({errorMessage: error});
        }
    });

    app.post('/retrieve-checkout-session-status', async (req, res) => {
        const checkoutId = req.body.checkoutId;

        try {
            const session = await stripe.checkout.sessions.retrieve(`${checkoutId}`);

            if (session.object === 'checkout.session') {
                // Check this for result of payment (enum: paid || unpaid || no_payment_required)
                res.json({ payment_status: session.payment_status });  
            } else {
                res.status(400).json({message: "Invalid id, not returning a session object"});
            }
        } catch (error) {
            res.status(400).json({errorMessage: error});
        }
    });

    // const stripeErrorHandling = () => {
    //     switch (err.type) {
    //       case 'StripeCardError':
    //         // A declined card error
    //         err.message; // => e.g. "Your card's expiration year is invalid."
    //         break;
    //       case 'StripeRateLimitError':
    //         // Too many requests made to the API too quickly
    //         break;
    //       case 'StripeInvalidRequestError':
    //         // Invalid parameters were supplied to Stripe's API
    //         break;
    //       case 'StripeAPIError':
    //         // An error occurred internally with Stripe's API
    //         break;
    //       case 'StripeConnectionError':
    //         // Some kind of error occurred during the HTTPS communication
    //         break;
    //       case 'StripeAuthenticationError':
    //         // You probably used an incorrect API key
    //         break;
    //       default:
    //         // Handle any other types of unexpected errors
    //         break;
    //     }
    // }

}