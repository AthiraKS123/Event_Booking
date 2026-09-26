import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  Ticket,
  MapPin,
  Calendar,
  CheckCircle2,
  Download,
  ShieldCheck,
  UserCheck,
  Mail,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Ban,
  Check,
  Info,
} from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [emailingId, setEmailingId] = useState(null);
  const [emailStatus, setEmailStatus] = useState({});
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'confirmed', 'cancelled'

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of plans / Schedule conflict');
  const [customReason, setCustomReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [feedback, setFeedback] = useState(null);

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

  const handleOpenCancelModal = (booking) => {
    setCancellingBooking(booking);
    setCancelReason('Change of plans / Schedule conflict');
    setCustomReason('');
    setFeedback(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;

    try {
      setIsCancelling(true);
      const effectiveReason = cancelReason === 'Other' ? (customReason || 'Other') : cancelReason;

      const res = await client.post(`/bookings/${cancellingBooking._id}/cancel`, {
        reason: effectiveReason,
      });

      // Update state locally
      setBookings((prev) =>
        prev.map((b) =>
          b._id === cancellingBooking._id
            ? {
                ...b,
                status: 'cancelled',
                cancelledAt: res.data.booking?.cancelledAt || new Date().toISOString(),
                cancellationReason: effectiveReason,
                refundId: res.data.booking?.refundId,
                refundAmount: res.data.booking?.refundAmount || b.totalAmount,
                refundStatus: res.data.booking?.refundStatus || 'processed',
              }
            : b
        )
      );

      setFeedback({
        type: 'success',
        message: `Ticket ${cancellingBooking.bookingCode} cancelled successfully! 100% refund of ₹${cancellingBooking.totalAmount} has been initiated.`,
      });
      setCancellingBooking(null);
    } catch (err) {
      console.error('Cancellation error:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to cancel ticket. Please try again.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'confirmed') return b.status === 'confirmed';
    if (activeTab === 'cancelled') return b.status === 'cancelled' || b.status === 'refunded';
    return true;
  });

  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled' || b.status === 'refunded').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2434] dark:text-[#F3F5F9] tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-[#DE5D3B] dark:text-[#FF6B4A]" />
            My Event Tickets & Bookings
          </h1>
          <p className="text-[#676C75] dark:text-[#94A3B8] text-xs">
            Manage your verified tickets, download passes, resend emails, or request cancellations & refunds
          </p>
        </div>

        {/* Status Filter Tabs */}
        {bookings.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF7F2] dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] rounded-xl self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-[#1E2838] text-[#1C2434] dark:text-[#F3F5F9] shadow-xs font-bold border border-[#EBE5DC] dark:border-[#283548]'
                  : 'text-[#676C75] dark:text-[#94A3B8] hover:text-[#1C2434] dark:hover:text-[#F3F5F9]'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'confirmed'
                  ? 'bg-white dark:bg-[#1E2838] text-emerald-800 dark:text-emerald-400 shadow-xs font-bold border border-emerald-200 dark:border-emerald-800'
                  : 'text-[#676C75] dark:text-[#94A3B8] hover:text-[#1C2434] dark:hover:text-[#F3F5F9]'
              }`}
            >
              Active ({confirmedCount})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'cancelled'
                  ? 'bg-white dark:bg-[#1E2838] text-rose-800 dark:text-rose-400 shadow-xs font-bold border border-rose-200 dark:border-rose-800'
                  : 'text-[#676C75] dark:text-[#94A3B8] hover:text-[#1C2434] dark:hover:text-[#F3F5F9]'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>
        )}
      </div>


      {/* Global Alert Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-start justify-between gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-[#676C75] dark:text-[#94A3B8]">Loading your tickets & bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-[#EBE5DC] dark:border-[#283548] space-y-3 shadow-xs bg-white dark:bg-[#141B26] transition-colors">
          <Ticket className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
          <p className="text-[#676C75] dark:text-[#94A3B8] text-sm">
            {activeTab === 'all'
              ? 'You currently have no event tickets.'
              : activeTab === 'confirmed'
              ? 'No active confirmed tickets found.'
              : 'No cancelled tickets found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((booking) => {
            const isCancelled = booking.status === 'cancelled' || booking.status === 'refunded';
            const canCancel = !isCancelled && !booking.isCheckedIn;

            return (
              <div
                key={booking._id}
                className={`glass-card rounded-3xl overflow-hidden border shadow-xs space-y-4 p-6 flex flex-col justify-between transition-all ${
                  isCancelled
                    ? 'border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#111620] opacity-90'
                    : 'border-[#EBE5DC] dark:border-[#283548] bg-white dark:bg-[#141B26]'
                }`}
              >
                <div className="space-y-4">
                  {/* Status header badge & code */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#EBE5DC] dark:border-[#283548] pb-3">
                    {isCancelled ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-400 font-bold text-xs border border-rose-300 dark:border-rose-800 flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        CANCELLED & REFUNDED
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 font-bold text-xs border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        CONFIRMED & PAID
                      </span>
                    )}

                    <span className="font-mono font-extrabold text-xs text-[#DE5D3B] dark:text-[#FF6B4A]">
                      {booking.bookingCode}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div>
                    <h3 className={`text-lg font-bold mb-2 ${isCancelled ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-[#1C2434] dark:text-[#F3F5F9]'}`}>
                      {booking.event?.title || 'Event Ticket'}
                    </h3>
                    <div className="space-y-1 text-xs text-[#676C75] dark:text-[#94A3B8]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#DE5D3B] dark:text-[#FF6B4A] shrink-0" />
                        <span className="font-medium">{booking.event?.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#DE5D3B] dark:text-[#FF6B4A] shrink-0" />
                        <span className="font-medium">
                          {booking.event?.dateTime ? new Date(booking.event.dateTime).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Details Panel */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] space-y-2 text-xs">
                    <div className="flex justify-between text-[#676C75] dark:text-[#94A3B8]">
                      <span>Tier / Class:</span>
                      <span className="font-bold text-[#1C2434] dark:text-[#F3F5F9]">{booking.tierName}</span>
                    </div>
                    {booking.selectedSeats && booking.selectedSeats.length > 0 && (
                      <div className="flex justify-between text-[#676C75] dark:text-[#94A3B8]">
                        <span>Assigned Seats:</span>
                        <span className="font-mono font-bold text-[#DE5D3B] dark:text-[#FF6B4A] bg-white dark:bg-[#141B26] px-2 py-0.5 rounded border border-[#DE5D3B]/20 dark:border-[#FF6B4A]/30">
                          {booking.selectedSeats.join(', ')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#676C75] dark:text-[#94A3B8]">
                      <span>Seat Quantity:</span>
                      <span className="font-bold text-[#1C2434] dark:text-[#F3F5F9]">{booking.quantity} Ticket(s)</span>
                    </div>
                    <div className="flex justify-between text-[#676C75] dark:text-[#94A3B8] border-t border-[#EBE5DC] dark:border-[#283548] pt-2 text-sm">
                      <span>{isCancelled ? 'Refunded Amount:' : 'Total Amount Paid:'}</span>
                      <span className="font-black text-[#DE5D3B] dark:text-[#FF6B4A] text-base">₹{booking.totalAmount}</span>
                    </div>
                  </div>

                  {/* Gatekeeper Check-In Status or Cancellation Audit */}
                  {isCancelled ? (
                    <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 space-y-1.5 text-xs text-rose-900 dark:text-rose-300">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                        <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        Pass Cancelled & Seats Released
                      </div>
                      {booking.refundId && (
                        <div className="flex justify-between text-rose-700 dark:text-rose-400 text-[11px]">
                          <span>Refund Ref ID:</span>
                          <span className="font-mono font-bold">{booking.refundId}</span>
                        </div>
                      )}
                      {booking.cancelledAt && (
                        <div className="flex justify-between text-rose-700 dark:text-rose-400 text-[11px]">
                          <span>Cancelled At:</span>
                          <span>{new Date(booking.cancelledAt).toLocaleString()}</span>
                        </div>
                      )}
                      {booking.cancellationReason && (
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                          "{booking.cancellationReason}"
                        </div>
                      )}
                    </div>
                  ) : booking.isCheckedIn ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                      <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Checked In at Gate (
                        {new Date(booking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2838] border border-[#DE5D3B]/20 dark:border-[#FF6B4A]/30 text-[#DE5D3B] dark:text-[#FF6B4A] text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-[#DE5D3B] dark:text-[#FF6B4A] shrink-0" />
                      <span>Valid Entry Pass - Ready for Gate Check-In</span>
                    </div>
                  )}

                  {/* Email dispatch alert status */}
                  {emailStatus[booking._id] && (
                    <div className="p-2.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                      {emailStatus[booking._id].message}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-2 border-t border-[#EBE5DC] dark:border-[#283548] flex flex-col gap-2">
                  {!isCancelled ? (
                    <>
                      <button
                        onClick={() => handleDownloadPDF(booking._id, booking.bookingCode)}
                        disabled={downloadingId === booking._id}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E85535] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Download className="w-4 h-4 text-white" />
                        {downloadingId === booking._id ? 'Generating PDF Ticket...' : 'Download Official PDF Ticket'}
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => handleResendEmail(booking._id)}
                          disabled={emailingId === booking._id}
                          className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-[#1E2838] hover:bg-[#FAF7F2] dark:hover:bg-[#283548] border border-[#DE5D3B]/20 dark:border-[#283548] text-[#676C75] dark:text-[#CBD5E1] hover:text-[#DE5D3B] dark:hover:text-[#FF6B4A] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#DE5D3B] dark:text-[#FF6B4A]" />
                          {emailingId === booking._id ? 'Sending...' : 'Email E-Ticket'}
                        </button>

                        {canCancel ? (
                          <button
                            onClick={() => handleOpenCancelModal(booking)}
                            className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-[#1E2838] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                            Cancel Ticket
                          </button>
                        ) : (
                          <div className="text-[11px] text-gray-400 font-medium text-center py-2 self-center">
                            Already checked-in
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-gray-100 dark:bg-[#1E2838] rounded-xl text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                      🔒 Pass Invalidated — 100% Refund Initiated to Original Source
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141B26] rounded-3xl p-6 max-w-md w-full border border-[#EBE5DC] dark:border-[#283548] shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-[#1C2434] dark:text-[#F3F5F9]">Cancel Confirmed Ticket?</h3>
                <p className="text-xs text-[#676C75] dark:text-[#94A3B8]">
                  This action releases your seats and initiates a full payment refund.
                </p>
              </div>
            </div>

            {/* Ticket Summary Box */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#676C75] dark:text-[#94A3B8]">Event:</span>
                <span className="font-bold text-[#1C2434] dark:text-[#F3F5F9]">{cancellingBooking.event?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#676C75] dark:text-[#94A3B8]">Booking Code:</span>
                <span className="font-mono font-bold text-[#DE5D3B] dark:text-[#FF6B4A]">{cancellingBooking.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#676C75] dark:text-[#94A3B8]">Seats / Tier:</span>
                <span className="font-medium text-[#1C2434] dark:text-[#F3F5F9]">
                  {cancellingBooking.tierName} ({cancellingBooking.quantity} Seat{cancellingBooking.quantity > 1 ? 's' : ''})
                </span>
              </div>
              {cancellingBooking.selectedSeats && cancellingBooking.selectedSeats.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#676C75] dark:text-[#94A3B8]">Assigned Seats:</span>
                  <span className="font-mono font-bold text-[#DE5D3B] dark:text-[#FF6B4A]">
                    {cancellingBooking.selectedSeats.join(', ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#EBE5DC] dark:border-[#283548] pt-2 font-bold text-sm">
                <span className="text-emerald-800 dark:text-emerald-400">Refund Amount (100%):</span>
                <span className="text-emerald-700 dark:text-emerald-400">₹{cancellingBooking.totalAmount}</span>
              </div>
            </div>

            {/* Refund & Inventory Policy Note */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Cancellation & Refund Terms:
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                <li>Your reserved seats will be returned immediately to the public pool.</li>
                <li>Your entry QR code will be permanently invalidated.</li>
                <li>Full refund of ₹{cancellingBooking.totalAmount} will credit back within 5-7 business days.</li>
              </ul>
            </div>

            {/* Cancellation Reason Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C2434] dark:text-[#F3F5F9]">Reason for Cancellation:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#EBE5DC] dark:border-[#283548] bg-white dark:bg-[#1E2838] text-[#1C2434] dark:text-[#F3F5F9] focus:outline-none focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A]"
              >
                <option value="Change of plans / Schedule conflict">Change of plans / Schedule conflict</option>
                <option value="Booked by mistake / wrong date">Booked by mistake / wrong date</option>
                <option value="Found alternative event">Found alternative event</option>
                <option value="Health or personal emergency">Health or personal emergency</option>
                <option value="Other">Other reason</option>
              </select>

              {cancelReason === 'Other' && (
                <input
                  type="text"
                  placeholder="Please specify reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EBE5DC] dark:border-[#283548] bg-white dark:bg-[#1E2838] text-[#1C2434] dark:text-[#F3F5F9] focus:outline-none focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] mt-1"
                />
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#EBE5DC] dark:border-[#283548] text-[#676C75] dark:text-[#94A3B8] hover:text-[#1C2434] dark:hover:text-[#F3F5F9] hover:bg-[#FAF7F2] dark:hover:bg-[#1E2838] font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                Keep Ticket
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    Processing Refund...
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    Confirm Cancellation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


