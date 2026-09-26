import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X, Sparkles, User, Ticket, Calendar, Clock } from 'lucide-react';

const CheckInResultModal = ({ result, onClose, onScanNext }) => {
  if (!result) return null;

  const isSuccess = result.status === 'SUCCESS';
  const isDuplicate = result.status === 'DUPLICATE';
  const isInvalid = result.status === 'INVALID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 bg-white dark:bg-[#141B26] transition-all transform animate-scaleUp ${
          isSuccess
            ? 'border-emerald-400 dark:border-emerald-600'
            : isDuplicate
            ? 'border-amber-400 dark:border-amber-600'
            : 'border-red-400 dark:border-red-600'
        }`}
      >
        {/* Top Banner Accent */}
        <div
          className={`py-4 px-6 text-center font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 ${
            isSuccess
              ? 'bg-[#DE5D3B] dark:bg-[#FF6B4A] text-white border-b border-[#DE5D3B]/20'
              : isDuplicate
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-b border-amber-300 dark:border-amber-700'
              : 'bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-200 border-b border-red-300 dark:border-red-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {isSuccess ? 'Official Gatekeeper Verification' : 'Gatekeeper Security Alert'}
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6 text-center">
          {/* Animated Status Icon */}
          <div className="flex justify-center">
            {isSuccess && (
              <div className="w-20 h-20 rounded-full bg-emerald-500 border-4 border-emerald-100 flex items-center justify-center shadow-lg animate-pulse text-white">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            )}
            {isDuplicate && (
              <div className="w-20 h-20 rounded-full bg-amber-500 border-4 border-amber-100 flex items-center justify-center shadow-lg text-white">
                <AlertTriangle className="w-12 h-12" />
              </div>
            )}
            {isInvalid && (
              <div className="w-20 h-20 rounded-full bg-red-500 border-4 border-red-100 flex items-center justify-center shadow-lg text-white">
                <XCircle className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isSuccess
                  ? 'text-emerald-900 dark:text-emerald-300'
                  : isDuplicate
                  ? 'text-amber-900 dark:text-amber-300'
                  : 'text-red-900 dark:text-red-300'
              }`}
            >
              {isSuccess ? '🎉 ENTRY GRANTED!' : isDuplicate ? '⚠️ DUPLICATE ENTRY DETECTED' : '🛑 ACCESS DENIED'}
            </h2>
            <p className="text-xs sm:text-sm text-[#676C75] dark:text-[#94A3B8] font-medium max-w-sm mx-auto">
              {result.message}
            </p>
          </div>

          {/* Attendee Details Card (On Success) */}
          {isSuccess && result.booking && (
            <div className="bg-[#FAF7F2] dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] rounded-2xl p-5 text-left space-y-4 shadow-xs transition-colors">
              <div className="flex items-center justify-between border-b border-[#EBE5DC] dark:border-[#283548] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#DE5D3B] dark:bg-[#FF6B4A] flex items-center justify-center text-white shadow-xs">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#676C75] dark:text-[#94A3B8] uppercase tracking-wider block font-bold">Attendee Name</span>
                    <span className="text-base font-bold text-[#1C2434] dark:text-[#F3F5F9]">{result.booking.attendeeName}</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#DE5D3B] dark:bg-[#FF6B4A] text-white text-xs font-mono font-bold shadow-xs">
                  {result.booking.bookingCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#676C75] dark:text-[#94A3B8] block text-[10px] font-bold uppercase">Event Title</span>
                  <span className="font-bold text-[#1C2434] dark:text-[#F3F5F9]">{result.booking.eventTitle}</span>
                </div>
                <div>
                  <span className="text-[#676C75] dark:text-[#94A3B8] block text-[10px] font-bold uppercase">Seat Tier & Qty</span>
                  <span className="font-bold text-[#1C2434] dark:text-[#F3F5F9]">{result.booking.tierName} ({result.booking.quantity} Pass{result.booking.quantity > 1 ? 'es' : ''})</span>
                </div>
                <div>
                  <span className="text-[#676C75] dark:text-[#94A3B8] block text-[10px] font-bold uppercase">Venue</span>
                  <span className="font-bold text-[#1C2434] dark:text-[#F3F5F9]">{result.booking.venue || 'Main Gate Access'}</span>
                </div>
                <div>
                  <span className="text-[#676C75] dark:text-[#94A3B8] block text-[10px] font-bold uppercase">Check-In Time</span>
                  <span className="font-bold text-[#1C2434] dark:text-[#F3F5F9]">{new Date(result.booking.checkedInAt || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-5 rounded-xl bg-white dark:bg-[#1E2838] hover:bg-gray-50 dark:hover:bg-[#283548] text-[#676C75] dark:text-[#94A3B8] font-bold text-xs border border-gray-200 dark:border-[#283548] transition-all cursor-pointer"
            >
              Done / Close
            </button>
            {onScanNext && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onScanNext();
                }}
                className="flex-1 py-3 px-5 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E55A3A] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📷 Scan Next Attendee</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInResultModal;
