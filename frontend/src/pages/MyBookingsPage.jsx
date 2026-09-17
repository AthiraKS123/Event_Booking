import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Ticket, MapPin, Calendar, CheckCircle2, Download, ShieldCheck, UserCheck, Mail } from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [emailingId, setEmailingId] = useState(null);
  const [emailStatus, setEmailStatus] = useState({});

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await client.get('/bookings/my');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (bookingId, bookingCode) => {
    try {
      setDownloadingId(bookingId);
      const response = await client.get(`/bookings/${bookingId}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `EventTicket_${bookingCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download ticket PDF:', err);
      alert('Could not download ticket PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleResendEmail = async (bookingId) => {
    try {
      setEmailingId(bookingId);
      const res = await client.post(`/bookings/${bookingId}/resend-email`);
      setEmailStatus((prev) => ({
        ...prev,
        [bookingId]: { success: true, message: res.data.message || 'Email sent successfully!' },
      }));
    } catch (err) {
      console.error('Failed to resend email:', err);
      setEmailStatus((prev) => ({
        ...prev,
        [bookingId]: { success: false, message: err.response?.data?.message || 'Failed to send email' },
      }));
    } finally {
      setEmailingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2A081C] tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-[#620F3C]" />
            My Confirmed Event Tickets
          </h1>
          <p className="text-[#6E455E] text-xs">
            Cryptographically verified Razorpay transactions, email delivery & PDF passes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#6E455E]">Loading your confirmed tickets...</div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-[#620F3C]/12 space-y-3 shadow-sm">
          <p className="text-[#6E455E] text-sm">You currently have no confirmed event tickets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="glass-card rounded-3xl overflow-hidden border border-[#620F3C]/12 shadow-sm space-y-4 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[#620F3C]/10 pb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    CONFIRMED & PAID
                  </span>
                  <span className="font-mono font-extrabold text-xs text-[#620F3C]">
                    {booking.bookingCode}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#2A081C] mb-2">{booking.event?.title || 'Event Ticket'}</h3>
                  <div className="space-y-1 text-xs text-[#6E455E]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#620F3C] shrink-0" />
                      <span className="font-medium">{booking.event?.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#620F3C] shrink-0" />
                      <span className="font-medium">{new Date(booking.event?.dateTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6F9] border border-[#620F3C]/12 space-y-2 text-xs">
                  <div className="flex justify-between text-[#6E455E]">
                    <span>Tier / Class:</span>
                    <span className="font-bold text-[#2A081C]">{booking.tierName}</span>
                  </div>
                  {booking.selectedSeats && booking.selectedSeats.length > 0 && (
                    <div className="flex justify-between text-[#6E455E]">
                      <span>Assigned Seats:</span>
                      <span className="font-mono font-bold text-[#620F3C] bg-white px-2 py-0.5 rounded border border-[#620F3C]/20">
                        {booking.selectedSeats.join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#6E455E]">
                    <span>Seat Quantity:</span>
                    <span className="font-bold text-[#2A081C]">{booking.quantity} Ticket(s)</span>
                  </div>
                  <div className="flex justify-between text-[#6E455E] border-t border-[#620F3C]/10 pt-2 text-sm">
                    <span>Total Amount Paid:</span>
                    <span className="font-black text-[#620F3C] text-base">₹{booking.totalAmount}</span>
                  </div>
                </div>

                {/* Gatekeeper Check-In Status Indicator */}
                {booking.isCheckedIn ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Checked In at Gate ({new Date(booking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F5E0EC]/60 border border-[#620F3C]/20 text-[#620F3C] text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#620F3C] shrink-0" />
                    <span>Valid Entry Pass - Ready for Gate Check-In</span>
                  </div>
                )}

                {/* Email dispatch alert status */}
                {emailStatus[booking._id] && (
                  <div className="p-2.5 rounded-xl text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-800">
                    {emailStatus[booking._id].message}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2 border-t border-[#620F3C]/10 flex flex-col gap-2">
                <button
                  onClick={() => handleDownloadPDF(booking._id, booking.bookingCode)}
                  disabled={downloadingId === booking._id}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#620F3C] hover:bg-[#4E0B2F] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-white" />
                  {downloadingId === booking._id ? 'Generating PDF Ticket...' : 'Download Official PDF Ticket'}
                </button>

                <button
                  onClick={() => handleResendEmail(booking._id)}
                  disabled={emailingId === booking._id}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-50 border border-[#620F3C]/20 text-[#6E455E] hover:text-[#620F3C] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 text-[#620F3C]" />
                  {emailingId === booking._id ? 'Sending Email...' : 'Email E-Ticket to Me'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
