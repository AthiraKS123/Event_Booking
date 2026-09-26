import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { ShieldCheck, Plus, Sparkles, Trash2, Calendar, MapPin, CheckCircle2, XCircle, QrCode, UserCheck, AlertTriangle, Search, Activity, Camera, Upload } from 'lucide-react';
import QrScannerModal from '../components/QrScannerModal';
import CheckInResultModal from '../components/CheckInResultModal';
import { soundEffects } from '../utils/audioFeedback';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'gatekeeper'
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Gatekeeper Check-In State
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Event Form State
  const [title, setTitle] = useState('Sunburn Festival Goa 2026');
  const [description, setDescription] = useState('Exclusive high-concurrency electronic music festival');
  const [venue, setVenue] = useState('Goa Beach Arena');
  const [category, setCategory] = useState('Music');
  const [vipCapacity, setVipCapacity] = useState(10);
  const [vipPrice, setVipPrice] = useState(200);
  const [genCapacity, setGenCapacity] = useState(100);
  const [genPrice, setGenPrice] = useState(50);

  useEffect(() => {
    fetchEvents();
    fetchScanHistory();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await client.get('/events');
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScanHistory = async () => {
    try {
      const res = await client.get('/bookings/gatekeeper/history');
      if (res.data?.history) {
        setScanHistory(res.data.history);
      }
    } catch (err) {
      console.warn('Could not fetch scan history:', err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await client.post('/admin/events', {
        title,
        description,
        venue,
        dateTime: new Date(Date.now() + 14 * 86400000).toISOString(),
        category,
        ticketTiers: [
          { name: 'VIP', price: Number(vipPrice), totalSeats: Number(vipCapacity) },
          { name: 'General', price: Number(genPrice), totalSeats: Number(genCapacity) },
        ],
      });
      setSuccessMsg(`✅ Event "${res.data.event.title}" published successfully!`);
      setShowForm(false);
      fetchEvents();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await client.delete(`/admin/events/${eventId}`);
      setSuccessMsg('Event deleted successfully');
      fetchEvents();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleAddSeats = async (event, tierId, amountToAdd = 10) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const updatedTiers = event.ticketTiers.map((t) => {
        if (t._id === tierId) {
          return {
            ...t,
            totalSeats: Number(t.totalSeats) + amountToAdd,
            availableSeats: Number(t.availableSeats) + amountToAdd,
          };
        }
        return t;
      });

      await client.put(`/admin/events/${event._id}`, {
        ticketTiers: updatedTiers,
      });

      setSuccessMsg(`✅ Added +${amountToAdd} seats to ${event.title}!`);
      fetchEvents();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to increase seats');
    }
  };

  // Core Gatekeeper Ticket Check-In Handler
  const processCheckIn = async (rawCode) => {
    if (!rawCode || !rawCode.trim()) return;

    setCheckInLoading(true);
    setScanResult(null);

    let codeToSubmit = rawCode.trim();
    if (codeToSubmit.startsWith('{')) {
      try {
        const parsed = JSON.parse(codeToSubmit);
        if (parsed.bookingCode) codeToSubmit = parsed.bookingCode;
      } catch (err) {
        // ignore parse error
      }
    }

    try {
      const res = await client.post('/bookings/check-in', {
        bookingCode: codeToSubmit,
      });

      const resultObj = {
        status: 'SUCCESS',
        message: res.data.message,
        booking: res.data.booking,
        timestamp: new Date().toLocaleTimeString(),
      };

      setScanResult(resultObj);
      setScanHistory((prev) => [resultObj, ...prev]);
      setCheckInCode('');
      // Audio chime: success
      soundEffects.playSuccess();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Verification Failed';
      const isDuplicate = errMsg.includes('ALREADY CHECKED IN');
      
      const resultObj = {
        status: isDuplicate ? 'DUPLICATE' : 'INVALID',
        message: errMsg,
        bookingCode: codeToSubmit,
        timestamp: new Date().toLocaleTimeString(),
      };

      setScanResult(resultObj);
      setScanHistory((prev) => [resultObj, ...prev]);
      
      // Audio chime: warning for duplicate, error for invalid
      if (isDuplicate) {
        soundEffects.playWarning();
      } else {
        soundEffects.playError();
      }
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleGatekeeperCheckIn = async (e) => {
    e.preventDefault();
    processCheckIn(checkInCode);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-3xl bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] shadow-xs transition-colors">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] dark:bg-[#1E2838] text-[#DE5D3B] dark:text-[#FF6B4A] border border-[#DE5D3B]/20 dark:border-[#FF6B4A]/30 text-xs font-bold mb-2 shadow-xs transition-colors">
            <ShieldCheck className="w-4 h-4 text-[#DE5D3B] dark:text-[#FF6B4A]" />
            Protected Admin & Gatekeeper Dashboard
          </div>
          <h1 className="text-2xl font-bold text-[#1C2434] dark:text-[#F3F5F9] transition-colors">Admin Management Console</h1>
          <p className="text-[#676C75] dark:text-[#94A3B8] text-sm transition-colors">Manage events, monitor live inventory, and verify attendee QR entry passes</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#FAF7F2] dark:bg-[#1E2838] p-1 rounded-2xl border border-[#EBE5DC] dark:border-[#283548] shrink-0 shadow-xs transition-colors">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'events' ? 'bg-[#DE5D3B] dark:bg-[#FF6B4A] text-white shadow-xs' : 'text-[#676C75] dark:text-[#94A3B8] hover:text-[#DE5D3B] dark:hover:text-[#FF6B4A]'
            }`}
          >
            Events & Inventory
          </button>
          <button
            onClick={() => setActiveTab('gatekeeper')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gatekeeper' ? 'bg-[#DE5D3B] dark:bg-[#FF6B4A] text-white shadow-xs' : 'text-[#676C75] dark:text-[#94A3B8] hover:text-[#DE5D3B] dark:hover:text-[#FF6B4A]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Gatekeeper Check-In
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 flex items-center gap-3 text-sm">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: GATEKEEPER CHECK-IN SYSTEM */}
      {activeTab === 'gatekeeper' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] shadow-xs space-y-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#1C2434] dark:text-[#F3F5F9] flex items-center gap-2 transition-colors">
                  <UserCheck className="w-5 h-5 text-[#DE5D3B] dark:text-[#FF6B4A]" />
                  Gatekeeper Venue Entrance Check-In
                </h3>
                <p className="text-xs text-[#676C75] dark:text-[#94A3B8] transition-colors">Scan ticket QR codes via live camera or enter code manually</p>
              </div>

              {/* Action Button to launch live camera scanner */}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E55A3A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer transform hover:scale-[1.02]"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>📷 Open Live Camera QR Scanner</span>
              </button>
            </div>

            <form onSubmit={handleGatekeeperCheckIn} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter Ticket Booking Code (e.g. EB-X7A89) or paste QR payload..."
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] placeholder-[#94A3B8] text-sm font-mono placeholder:font-sans focus:outline-none focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={checkInLoading}
                className="px-6 py-3 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2838] hover:bg-[#FDF2EC] dark:hover:bg-[#283548] text-[#DE5D3B] dark:text-[#FF6B4A] font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-[#DE5D3B]/20 dark:border-[#FF6B4A]/30 shadow-xs disabled:opacity-50"
              >
                {checkInLoading ? 'Verifying Ticket...' : 'Verify & Grant Entry'}
              </button>
            </form>

            {/* Live Scan Result Banner */}
            {scanResult && (
              <div className="animate-scaleUp">
                {scanResult.status === 'SUCCESS' && (
                  <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 space-y-3 shadow-sm transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200">🎉 ENTRY GRANTED!</div>
                        <div className="text-xs text-emerald-800 dark:text-emerald-300">{scanResult.message}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-white dark:bg-[#141B26] border border-emerald-200 dark:border-emerald-800 text-xs transition-colors">
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Attendee Name</span>
                        <span className="font-bold text-emerald-950 dark:text-emerald-100">{scanResult.booking.attendeeName}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Event Title</span>
                        <span className="font-bold text-emerald-950 dark:text-emerald-100">{scanResult.booking.eventTitle}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Ticket Tier & Seats</span>
                        <span className="font-bold text-emerald-950 dark:text-emerald-100">{scanResult.booking.tierName} ({scanResult.booking.quantity} seats)</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Check-In Time</span>
                        <span className="font-bold text-emerald-950 dark:text-emerald-100">{new Date(scanResult.booking.checkedInAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {scanResult.status === 'DUPLICATE' && (
                  <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 space-y-3 shadow-sm transition-colors">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xl font-bold text-amber-900 dark:text-amber-200">⚠️ DUPLICATE ENTRY ATTEMPT DETECTED!</div>
                        <div className="text-xs text-amber-800 dark:text-amber-300">{scanResult.message}</div>
                      </div>
                    </div>
                  </div>
                )}

                {scanResult.status === 'INVALID' && (
                  <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-600 text-red-950 dark:text-red-100 space-y-2 shadow-sm transition-colors">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 shrink-0" />
                      <div>
                        <div className="text-xl font-bold text-red-900 dark:text-red-200">🛑 INVALID TICKET / ACCESS DENIED</div>
                        <div className="text-xs text-red-800 dark:text-red-300">{scanResult.message}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scan History Feed */}
          {scanHistory.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] shadow-xs space-y-4 transition-colors">
              <h4 className="text-sm font-bold text-[#1C2434] dark:text-[#F3F5F9] flex items-center gap-2 transition-colors">
                <Activity className="w-4 h-4 text-[#DE5D3B] dark:text-[#FF6B4A]" />
                Live Gate Scan History Feed ({scanHistory.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {scanHistory.map((scan, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] text-xs font-semibold text-[#1C2434] dark:text-[#F3F5F9] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#DE5D3B] dark:text-[#FF6B4A] font-bold">{scan.bookingCode || scan.booking?.bookingCode}</span>
                      <span>•</span>
                      <span>{scan.status}</span>
                    </div>
                    <span className="text-[#676C75] dark:text-[#94A3B8] text-[10px]">{scan.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EVENTS & INVENTORY MANAGEMENT */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1C2434] dark:text-[#F3F5F9] flex items-center gap-2 transition-colors">
              <Sparkles className="w-5 h-5 text-[#DE5D3B] dark:text-[#FF6B4A]" />
              Published Events Catalog ({events.length})
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E55A3A] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-white" />
              {showForm ? 'Cancel Form' : 'Publish New Event'}
            </button>
          </div>

          {/* Create Event Form Modal / Expandable Card */}
          {showForm && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] shadow-sm space-y-4 animate-fadeIn transition-colors">
              <h3 className="text-base font-bold text-[#1C2434] dark:text-[#F3F5F9]">Publish New Event with Tier Capacities</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1C2434] dark:text-[#F3F5F9] mb-1 font-bold">Event Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] text-sm focus:outline-none focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#1C2434] dark:text-[#F3F5F9] mb-1 font-bold">Venue Location</label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] text-sm focus:outline-none focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#1C2434] dark:text-[#F3F5F9] mb-1 font-bold">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] text-sm focus:outline-none focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
                    rows="2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] transition-colors">
                  <div>
                    <label className="block text-[#676C75] dark:text-[#94A3B8] mb-1 font-bold">VIP Price (₹)</label>
                    <input
                      type="number"
                      value={vipPrice}
                      onChange={(e) => setVipPrice(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] font-bold focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#676C75] dark:text-[#94A3B8] mb-1 font-bold">VIP Capacity</label>
                    <input
                      type="number"
                      value={vipCapacity}
                      onChange={(e) => setVipCapacity(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] font-bold focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#676C75] dark:text-[#94A3B8] mb-1 font-bold">General Price (₹)</label>
                    <input
                      type="number"
                      value={genPrice}
                      onChange={(e) => setGenPrice(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] font-bold focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#676C75] dark:text-[#94A3B8] mb-1 font-bold">General Capacity</label>
                    <input
                      type="number"
                      value={genCapacity}
                      onChange={(e) => setGenCapacity(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] font-bold focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E55A3A] text-white font-bold text-sm shadow-xs cursor-pointer transition-all"
                >
                  Confirm & Create Event
                </button>
              </form>
            </div>
          )}

          {/* Events Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-white dark:bg-[#141B26] rounded-3xl overflow-hidden border border-[#EBE5DC] dark:border-[#283548] shadow-xs p-6 flex flex-col justify-between space-y-4 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#1C2434] dark:text-[#F3F5F9]">{event.title}</h3>
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-[#676C75] dark:text-[#94A3B8]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#DE5D3B] dark:text-[#FF6B4A] shrink-0" />
                      <span className="font-medium">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#DE5D3B] dark:text-[#FF6B4A] shrink-0" />
                      <span className="font-medium">{new Date(event.dateTime).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#EBE5DC] dark:border-[#283548] text-xs">
                    <div className="text-[10px] font-bold text-[#676C75] dark:text-[#94A3B8] uppercase tracking-wider">Live Inventory Status</div>
                    {event.ticketTiers.map((tier) => (
                      <div key={tier._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] gap-2 transition-colors">
                        <div>
                          <span className="font-bold text-[#1C2434] dark:text-[#F3F5F9]">{tier.name}</span>
                          <span className="text-[#DE5D3B] dark:text-[#FF6B4A] font-black text-[11px] ml-2">₹{tier.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#676C75] dark:text-[#94A3B8] font-medium text-[11px]">
                            {tier.availableSeats} / {tier.totalSeats} left
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddSeats(event, tier._id, 10)}
                            className="px-2.5 py-1 rounded-lg bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E55A3A] text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Add 10 seats to this tier"
                          >
                            <Plus className="w-3 h-3" /> +10 Seats
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Camera QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(decodedText) => {
          setIsScannerOpen(false);
          processCheckIn(decodedText);
        }}
      />

      {/* Entry Granted / Security Alert Result Popup Modal */}
      <CheckInResultModal
        result={scanResult}
        onClose={() => setScanResult(null)}
        onScanNext={() => {
          setScanResult(null);
          setIsScannerOpen(true);
        }}
      />
    </div>
  );
}
