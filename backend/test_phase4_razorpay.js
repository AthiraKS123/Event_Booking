const crypto = require('crypto');

async function testPhase4Razorpay() {
  try {
    console.log('🚀 Phase 4: Starting Razorpay Payment & Signature Verification Test...\n');

    // 1. Login User
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user3@example.com', password: 'password123' }),
    }).then(r => r.json());

    const token = loginRes.accessToken;
    console.log('1. User Authenticated:', loginRes.user.name);

    // 2. Fetch Events
    const eventsRes = await fetch('http://localhost:5000/api/events').then(r => r.json());
    const event = eventsRes.events[0];
    const tier = event.ticketTiers[0];
    console.log(`2. Target Event: "${event.title}" | Tier: "${tier.name}" ($${tier.price})`);

    // 3. Hold Seat
    const holdRes = await fetch('http://localhost:5000/api/bookings/hold', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ eventId: event._id, tierId: tier._id, quantity: 1 }),
    }).then(r => r.json());

    console.log('3. Seat Hold Response:', holdRes.message);
    const holdId = holdRes.hold.id;

    // 4. Create Razorpay Order
    const orderRes = await fetch('http://localhost:5000/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ holdId }),
    }).then(r => r.json());

    if (!orderRes.success) {
      console.error('Order creation failed:', orderRes);
      return;
    }

    console.log('4. Razorpay Order Created:', orderRes.order.id, `(${orderRes.order.amount} paise)`);

    // 5. Generate Cryptographic Signature (HMAC SHA256: order_id + "|" + payment_id)
    const mockPaymentId = 'pay_rzp_test_' + Math.random().toString(36).substring(2, 10);
    const secret = process.env.RAZORPAY_KEY_SECRET || 'yV4KiyDDFC32pk4Pv2i4zimt';
    const payloadToSign = `${orderRes.order.id}|${mockPaymentId}`;
    const generatedSignature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');

    console.log('5. Generated HMAC-SHA256 Signature:', generatedSignature.substring(0, 20) + '...');

    // 6. Verify Payment Signature
    const verifyRes = await fetch('http://localhost:5000/api/payments/verify-signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderRes.order.id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: generatedSignature,
        bookingId: orderRes.order.bookingId,
      }),
    }).then(r => r.json());

    console.log('6. Signature Verification Result:', verifyRes.message);
    console.log('   Confirmed Ticket Booking Code:', verifyRes.booking.bookingCode);

    // 7. Verify My Bookings API
    const myBookingsRes = await fetch('http://localhost:5000/api/bookings/my', {
      headers: { 'Authorization': `Bearer ${token}` },
    }).then(r => r.json());

    console.log(`7. GET /api/bookings/my Returned ${myBookingsRes.count} Confirmed Ticket(s)!`);
    console.log('\n✅ PHASE 4 RAZORPAY INTEGRATION & SIGNATURE VERIFICATION PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Phase 4 Test Error:', err);
  }
}

testPhase4Razorpay();
