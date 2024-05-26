const express = require('express');
const bodyParser = require('body-parser');
const braintree = require('braintree');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox, // Use 'braintree.Environment.Production' for live transactions
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

// Debugging: Log environment variables to ensure they are loaded correctly
console.log("BRAINTREE_MERCHANT_ID:", process.env.BRAINTREE_MERCHANT_ID);
console.log("BRAINTREE_PUBLIC_KEY:", process.env.BRAINTREE_PUBLIC_KEY);
console.log("BRAINTREE_PRIVATE_KEY:", process.env.BRAINTREE_PRIVATE_KEY);

app.get('/client_token', (req, res) => {
    gateway.clientToken.generate({}, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(response.clientToken);
        }
    });
});

app.post('/checkout', (req, res) => {
    const { paymentMethodNonce, amount } = req.body;

    gateway.transaction.sale({
        amount: amount,
        paymentMethodNonce: paymentMethodNonce,
        options: {
            submitForSettlement: true,
        },
    }, (err, result) => {
        if (result.success) {
            res.send({ success: true, transactionId: result.transaction.id });
        } else {
            res.status(500).send({ success: false, error: result.message });
        }
    });
});

app.listen(3001, () => {
    console.log('Server is listening on port 3001');
});
