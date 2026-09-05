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
          <h1 className="text-2xl font-bold text-[#efdecd] tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-[#efdecd]" />
            My Confirmed Event Tickets
          </h1>
          <p className="text-[#efdecd]/70 text-xs">
            Cryptographically verified Razorpay transactions, email delivery & PDF passes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#efdecd]/70">Loading your confirmed tickets...</div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-[#efdecd]/20 space-y-3">
          <p className="text-[#efdecd]/70 text-sm">You currently have no confirmed event tickets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="glass-card rounded-2xl overflow-hidden border border-[#efdecd]/25 space-y-4 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[#F5E0EC]/20 pb-3">
                  <span className="px-2.5 py-0.5 rounded bg-[#620F3C] text-[#F5E0EC] font-bold text-xs border border-[#F5E0EC]/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#F5E0EC]" />
                    CONFIRMED & PAID
                  </span>
                  <span className="font-mono font-bold text-xs text-[#F5E0EC]">
                    {booking.bookingCode}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#F5E0EC] mb-2">{booking.event?.title || 'Event Ticket'}</h3>
                  <div className="space-y-1 text-xs text-[#F5E0EC]/70">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#F5E0EC] shrink-0" />
                      <span>{booking.event?.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#F5E0EC] shrink-0" />
                      <span>{new Date(booking.event?.dateTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#620F3C] border border-[#F5E0EC]/20 space-y-2 text-xs">
                  <div className="flex justify-between text-[#F5E0EC]/70">
                    <span>Tier / Class:</span>
                    <span className="font-semibold text-[#F5E0EC]">{booking.tierName}</span>
                  </div>
                  <div className="flex justify-between text-[#F5E0EC]/70">
                    <span>Seat Quantity:</span>
                    <span className="font-semibold text-[#F5E0EC]">{booking.quantity} Tickets</span>
                  </div>
                  <div className="flex justify-between text-[#F5E0EC]/70 border-t border-[#F5E0EC]/20 pt-2 text-sm">
                    <span>Total Amount Paid:</span>
                    <span className="font-bold text-[#F5E0EC]">₹{booking.totalAmount}</span>
                  </div>
                </div>

                {/* Gatekeeper Check-In Status Indicator */}
                {booking.isCheckedIn ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#620F3C] border border-[#F5E0EC]/30 text-[#F5E0EC]/80 text-xs font-medium">
                    <UserCheck className="w-4 h-4 text-[#F5E0EC] shrink-0" />
                    <span>Checked In at Gate ({new Date(booking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#620F3C] border border-[#F5E0EC]/30 text-[#F5E0EC] text-xs font-medium">
                    <ShieldCheck className="w-4 h-4 text-[#F5E0EC] shrink-0" />
                    <span>Valid Entry Pass - Ready for Gate Check-In</span>
                  </div>
                )}

                {/* Email dispatch alert status */}
                {emailStatus[booking._id] && (
                  <div className="p-2.5 rounded-xl text-xs font-semibold bg-[#620F3C] border border-[#F5E0EC]/30 text-[#F5E0EC]">
                    {emailStatus[booking._id].message}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2 border-t border-[#F5E0EC]/20 flex flex-col gap-2">
                <button
                  onClick={() => handleDownloadPDF(booking._id, booking.bookingCode)}
                  disabled={downloadingId === booking._id}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F5E0EC] hover:bg-[#e7cadb] text-[#620F3C] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-[#620F3C]" />
                  {downloadingId === booking._id ? 'Generating PDF Ticket...' : 'Download Official PDF Ticket'}
                </button>

                <button
                  onClick={() => handleResendEmail(booking._id)}
                  disabled={emailingId === booking._id}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#620F3C] hover:bg-[#4A0A2C] border border-[#F5E0EC]/30 text-[#F5E0EC] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 text-[#F5E0EC]" />
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
