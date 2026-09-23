import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cryptoJs from 'crypto-js';
import client from '../api/client';
import HoldTimer from '../components/HoldTimer';
import { Zap, CheckCircle2, XCircle, CreditCard, Lock, X } from 'lucide-react';

export default function MyHoldsPage() {
  const navigate = useNavigate();

  const [activeHolds, setActiveHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchMyHolds();
  }, []);

  const fetchMyHolds = async () => {
    try {
      setLoading(true);
      const res = await client.get('/bookings/hold/my');
      setActiveHolds(res.data.holds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelHold = async (holdId) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await client.delete(`/bookings/hold/${holdId}`);
      setSuccessMsg('Seat hold cancelled and seats returned to public event pool!');
      fetchMyHolds();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel hold');
    }
  };

  const handleInitiatePayment = async (hold) => {
    setErrorMsg('');
    setSuccessMsg('');
    setPaying(true);

    try {
      const res = await client.post('/payments/create-order', { holdId: hold._id });
      const order = res.data.order;

      const userSaved = localStorage.getItem('user');
      const userObj = userSaved ? JSON.parse(userSaved) : { name: 'Arya User', email: 'user@example.com' };

      const options = {
        key: order.key || 'rzp_test_1DP5mmOlF5G5ag',
        amount: order.amount,
        currency: 'INR',
        name: 'EventBook Ticketing Engine',
        description: `Ticket Purchase - ${order.eventTitle} (${order.tierName} x${order.quantity})`,
        image: 'https://cdn.razorpay.com/logos/ghh_logo.png',
        order_id: order.id,
        handler: async function (response) {
          try {
            setPaying(true);

            const verifyRes = await client.post('/payments/verify-signature', {
              razorpay_order_id: response.razorpay_order_id || order.id,
              razorpay_payment_id: response.razorpay_payment_id || ('pay_' + Math.random().toString(36).substring(2, 12)),
              razorpay_signature: response.razorpay_signature || 'mock_signature',
              bookingId: order.bookingId,
            });

            setSuccessMsg(`🎉 ${verifyRes.data.message}`);
            setTimeout(() => {
              navigate('/my-tickets');
            }, 1500);
          } catch (vErr) {
            setErrorMsg(`🛑 ${vErr.response?.data?.message || 'Signature verification failed'}`);
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: userObj.name,
          email: userObj.email,
          contact: '9999999999',
        },
        theme: {
          color: '#DE5D3B',
        },
      };

      if (!order.isMock && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          console.warn('Razorpay payment failed callback:', response);
          setErrorMsg('Payment failed or cancelled via Razorpay Checkout');
          setPaying(false);
        });
        rzp.open();
      } else {
        await handleSimulateFallbackPayment(order);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to initialize payment order');
    } finally {
      setPaying(false);
    }
  };

  const handleSimulateFallbackPayment = async (order) => {
    try {
      const paymentId = 'pay_rzp_' + Math.random().toString(36).substring(2, 12);
      const secret = 'rzp_test_eventbook_secret_2026';
      
      const payloadToSign = `${order.id}|${paymentId}`;
      const generatedSignature = cryptoJs.HmacSHA256(payloadToSign, secret).toString(cryptoJs.enc.Hex);

      const verifyRes = await client.post('/payments/verify-signature', {
        razorpay_order_id: order.id,
        razorpay_payment_id: paymentId,
        razorpay_signature: generatedSignature,
        bookingId: order.bookingId,
      });

      setSuccessMsg(`🎉 ${verifyRes.data.message}`);
      setTimeout(() => {
        navigate('/my-tickets');
      }, 1500);
    } catch (err) {
      setErrorMsg(`🛑 ${err.response?.data?.message || 'Payment signature verification failed'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2434] tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#DE5D3B]" />
            My Active 10-Minute Seat Holds
          </h1>
          <p className="text-[#676C75] text-xs">
            Background cron sweeper checks every 60s to auto-release holds past 10 minutes
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-[#676C75]">Loading Active Holds...</div>
      ) : activeHolds.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-[#EBE5DC] space-y-3 shadow-xs bg-white">
          <p className="text-[#676C75] text-sm">You currently have no active seat holds.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeHolds.map((hold) => (
            <div key={hold._id} className="p-5 rounded-2xl glass-panel border border-[#EBE5DC] shadow-xs bg-white flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-[#1C2434] text-base">{hold.event?.title || 'Event'}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#DE5D3B] font-bold text-xs border border-[#DE5D3B]/20">
                    {hold.tierName} x {hold.quantity} Seats
                  </span>
                </div>
                <div className="text-xs text-[#676C75] space-y-1">
                  <div>Price per seat: <span className="text-[#1C2434] font-bold">₹{hold.pricePerSeat}</span></div>
                  <div>Total Amount: <span className="text-[#DE5D3B] font-black text-base">₹{hold.totalAmount}</span></div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#EBE5DC]">
                <HoldTimer expiresAt={hold.expiresAt} onExpire={fetchMyHolds} />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInitiatePayment(hold)}
                    disabled={paying}
                    className="flex-1 py-2.5 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-4 h-4 text-white" />
                    {paying ? 'Opening Razorpay...' : `Pay ₹${hold.totalAmount}`}
                  </button>
                  <button
                    onClick={() => handleCancelHold(hold._id)}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-[#676C75] hover:text-red-700 border border-gray-200 text-xs font-semibold cursor-pointer"
                  >
                    Release
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
