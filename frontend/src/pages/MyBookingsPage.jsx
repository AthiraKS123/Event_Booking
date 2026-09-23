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
          <h1 className="text-2xl font-bold text-[#1C2434] tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-[#DE5D3B]" />
            My Confirmed Event Tickets
          </h1>
          <p className="text-[#676C75] text-xs">
            Cryptographically verified Razorpay transactions, email delivery & PDF passes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#676C75]">Loading your confirmed tickets...</div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-[#EBE5DC] space-y-3 shadow-xs bg-white">
          <p className="text-[#676C75] text-sm">You currently have no confirmed event tickets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="glass-card rounded-3xl overflow-hidden border border-[#EBE5DC] shadow-xs space-y-4 p-6 flex flex-col justify-between bg-white">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[#EBE5DC] pb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    CONFIRMED & PAID
                  </span>
                  <span className="font-mono font-extrabold text-xs text-[#DE5D3B]">
                    {booking.bookingCode}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#1C2434] mb-2">{booking.event?.title || 'Event Ticket'}</h3>
                  <div className="space-y-1 text-xs text-[#676C75]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#DE5D3B] shrink-0" />
                      <span className="font-medium">{booking.event?.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#DE5D3B] shrink-0" />
                      <span className="font-medium">{new Date(booking.event?.dateTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EBE5DC] space-y-2 text-xs">
                  <div className="flex justify-between text-[#676C75]">
                    <span>Tier / Class:</span>
                    <span className="font-bold text-[#1C2434]">{booking.tierName}</span>
                  </div>
                  {booking.selectedSeats && booking.selectedSeats.length > 0 && (
                    <div className="flex justify-between text-[#676C75]">
                      <span>Assigned Seats:</span>
                      <span className="font-mono font-bold text-[#DE5D3B] bg-white px-2 py-0.5 rounded border border-[#DE5D3B]/20">
                        {booking.selectedSeats.join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#676C75]">
                    <span>Seat Quantity:</span>
                    <span className="font-bold text-[#1C2434]">{booking.quantity} Ticket(s)</span>
                  </div>
                  <div className="flex justify-between text-[#676C75] border-t border-[#EBE5DC] pt-2 text-sm">
                    <span>Total Amount Paid:</span>
                    <span className="font-black text-[#DE5D3B] text-base">₹{booking.totalAmount}</span>
                  </div>
                </div>

                {/* Gatekeeper Check-In Status Indicator */}
                {booking.isCheckedIn ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Checked In at Gate ({new Date(booking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DE5D3B]/20 text-[#DE5D3B] text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#DE5D3B] shrink-0" />
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
              <div className="pt-4 space-y-2 border-t border-[#EBE5DC] flex flex-col gap-2">
                <button
                  onClick={() => handleDownloadPDF(booking._id, booking.bookingCode)}
                  disabled={downloadingId === booking._id}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-white" />
                  {downloadingId === booking._id ? 'Generating PDF Ticket...' : 'Download Official PDF Ticket'}
                </button>

                <button
                  onClick={() => handleResendEmail(booking._id)}
                  disabled={emailingId === booking._id}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#DE5D3B]/20 text-[#676C75] hover:text-[#DE5D3B] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 text-[#DE5D3B]" />
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
