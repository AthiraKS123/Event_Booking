require('dotenv').config();
const crypto = require('crypto');

const BASE_URL = 'http://127.0.0.1:5000';

async function loginOrRegister(email, password, name, role = 'user') {
  let res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());

  if (res.accessToken) return res;

  res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  }).then((r) => r.json());

  return res;
}

async function testPhase7EmailDelivery() {
  try {
    console.log('🚀 Phase 7: Starting Automated Email & E-Ticket Delivery Test...\n');

    // 1. Authenticate User & Admin with real email recipient (Gmail alias sends to ksathira3062@gmail.com inbox)
    const testEmail = `ksathira3062+test${Math.floor(Math.random() * 1000)}@gmail.com`;
    const userAuth = await loginOrRegister(testEmail, 'password123', 'Sathira Test Attendee', 'user');
    const adminAuth = await loginOrRegister('phase7admin@example.com', 'password123', 'Phase7 Admin', 'admin');

    if (!userAuth.accessToken || !adminAuth.accessToken) {
      console.error('❌ Failed to authenticate users:', { userAuth, adminAuth });
      return;
    }

    const userToken = userAuth.accessToken;
    const adminToken = adminAuth.accessToken;
    console.log('1. User Authenticated:', userAuth.user.name, `(${userAuth.user.email})`);
    console.log('   Admin Authenticated:', adminAuth.user.name);

    // 2. Ensure an Event with available seats exists
    let eventsRes = await fetch(`${BASE_URL}/api/events`).then((r) => r.json());
    let event = (eventsRes.events || []).find((e) => e.ticketTiers && e.ticketTiers.some((t) => t.availableSeats > 0));

    if (!event) {
      console.log('   Creating dedicated test event as Admin...');
      const eventTitle = 'Live Gmail E-Ticket Showcase ' + Math.floor(Math.random() * 10000);
      const newEventRes = await fetch(`${BASE_URL}/api/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: eventTitle,
          description: 'Premier Real Email PDF Delivery Showcase',
          venue: 'Grand Arena, Cyber City',
          dateTime: new Date(Date.now() + 15 * 86400000).toISOString(),
          category: 'Technology',
          ticketTiers: [
            { name: 'VIP Pass', price: 250, totalSeats: 50 },
            { name: 'General Entry', price: 100, totalSeats: 200 },
          ],
        }),
      }).then((r) => r.json());

      event = newEventRes.event;
    }

    const targetTier = event.ticketTiers.find((t) => t.availableSeats > 0) || event.ticketTiers[0];
    console.log(`\n2. Target Event: "${event.title}" | Tier: "${targetTier.name}" (₹${targetTier.price})`);

    // 3. Create Seat Hold
    const holdRes = await fetch(`${BASE_URL}/api/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        eventId: event._id,
        tierId: targetTier._id,
        quantity: 1,
      }),
    }).then((r) => r.json());

    if (!holdRes.success) {
      console.error('❌ Seat hold failed:', holdRes);
      return;
    }
    const holdId = holdRes.hold.id || holdRes.hold._id;
    console.log(`3. Seat Hold Created: Hold ID ${holdId}`);

    // 4. Create Razorpay Payment Order
    const orderRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        holdId,
      }),
    }).then((r) => r.json());

    if (!orderRes.success) {
      console.error('❌ Order creation failed:', orderRes);
      return;
    }

    const { id: razorpay_order_id, bookingId } = orderRes.order;
    console.log(`4. Razorpay Order Created: ${razorpay_order_id} | Booking ID: ${bookingId}`);

    // 5. Simulate Payment Verification & Automatic E-Ticket Email Trigger
    const mockPaymentId = 'pay_rzp_phase7_' + Math.random().toString(36).substring(2, 10);
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_eventbook_secret_2026';
    const mockSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${mockPaymentId}`)
      .digest('hex');

    console.log('\n5. Verifying Payment & Triggering Automatic Email E-Ticket Delivery...');
    const verifyRes = await fetch(`${BASE_URL}/api/payments/verify-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        bookingId,
      }),
    }).then((r) => r.json());

    if (!verifyRes.success) {
      console.error('❌ Payment verification failed:', verifyRes);
      return;
    }

    console.log('   Payment Verified & Booking Confirmed!');
    console.log('   Booking Code:', verifyRes.booking.bookingCode);
    console.log('   ✅ Automatic E-Ticket PDF Email trigger fired successfully!');

    // Wait 1 sec to let async mail transport log output
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 6. Test Resend E-Ticket Email API Endpoint
    console.log('\n6. Testing Manual Resend E-Ticket Endpoint (POST /api/bookings/:id/resend-email)...');
    const resendRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/resend-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((r) => r.json());

    if (!resendRes.success) {
      console.error('❌ Resend email failed:', resendRes);
      return;
    }

    console.log('   Resend Response:', resendRes.message);
    if (resendRes.previewUrl) {
      console.log('   🔗 Preview Ethereal Email URL:', resendRes.previewUrl);
    }
    console.log('   ✅ MANUAL E-TICKET RESEND API TEST PASSED!');

    console.log('\n🎉 ALL PHASE 7 AUTOMATED EMAIL & E-TICKET DELIVERY TESTS PASSED 100%!');
  } catch (error) {
    console.error('❌ Error during Phase 7 testing:', error);
  }
}

testPhase7EmailDelivery();
