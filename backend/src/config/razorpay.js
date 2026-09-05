const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_eventbook_key_2026',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_eventbook_secret_2026',
});

module.exports = razorpayInstance;
