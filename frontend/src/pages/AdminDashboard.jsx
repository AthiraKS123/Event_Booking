import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { ShieldCheck, Plus, Sparkles, Trash2, Calendar, MapPin, CheckCircle2, XCircle, QrCode, UserCheck, AlertTriangle, Search, Activity } from 'lucide-react';

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

  // Gatekeeper Ticket Check-In Handler
  const handleGatekeeperCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInCode.trim()) return;

    setCheckInLoading(true);
    setScanResult(null);

    let codeToSubmit = checkInCode.trim();
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
    } finally {
      setCheckInLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-2xl bg-[#4A0A2C] border border-[#F5E0EC]/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F5E0EC]/20 text-[#F5E0EC] border border-[#F5E0EC]/30 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-[#F5E0EC]" />
            Protected Admin & Gatekeeper Dashboard
          </div>
          <h1 className="text-2xl font-bold text-[#F5E0EC]">Admin Management Console</h1>
          <p className="text-[#F5E0EC]/70 text-sm">Manage events, monitor live inventory, and verify attendee QR entry passes</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#32061D] p-1 rounded-xl border border-[#F5E0EC]/20 shrink-0">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'events' ? 'bg-[#F5E0EC] text-[#620F3C]' : 'text-[#F5E0EC]/70 hover:text-[#F5E0EC]'
            }`}
          >
            Events & Inventory
          </button>
          <button
            onClick={() => setActiveTab('gatekeeper')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gatekeeper' ? 'bg-[#F5E0EC] text-[#620F3C]' : 'text-[#F5E0EC]/70 hover:text-[#F5E0EC]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Gatekeeper Check-In
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#4A0A2C] border border-[#F5E0EC]/30 text-[#F5E0EC] flex items-center gap-3 text-sm">
          <XCircle className="w-5 h-5 text-[#F5E0EC]/70 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-[#4A0A2C] border border-[#F5E0EC]/40 text-[#F5E0EC] flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-[#F5E0EC] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: GATEKEEPER CHECK-IN SYSTEM */}
      {activeTab === 'gatekeeper' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#4A0A2C] border border-[#F5E0EC]/30 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#F5E0EC] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#F5E0EC]" />
                  Gatekeeper Venue Entrance Check-In
                </h3>
                <p className="text-xs text-[#F5E0EC]/70">Scan QR codes or enter ticket code (EB-XXXXXX) to validate attendee entry pass</p>
              </div>
            </div>

            <form onSubmit={handleGatekeeperCheckIn} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-[#F5E0EC]/50 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter Ticket Booking Code (e.g. EB-X7A89) or paste QR payload..."
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#32061D] border border-[#F5E0EC]/30 text-[#F5E0EC] text-sm font-mono placeholder:font-sans focus:outline-none focus:border-[#F5E0EC]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={checkInLoading}
                className="px-6 py-3 rounded-xl bg-[#F5E0EC] hover:bg-[#e7cadb] text-[#620F3C] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {checkInLoading ? 'Verifying Ticket...' : 'Verify & Grant Entry'}
              </button>
            </form>

            {/* Live Scan Result Banner */}
            {scanResult && (
              <div className="animate-scaleUp">
                {scanResult.status === 'SUCCESS' && (
                  <div className="p-6 rounded-xl bg-[#32061D] border-2 border-[#F5E0EC] text-[#F5E0EC] space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-[#F5E0EC] shrink-0" />
                      <div>
                        <div className="text-xl font-bold text-[#F5E0EC]">🎉 ENTRY GRANTED!</div>
                        <div className="text-xs text-[#F5E0EC]/80">{scanResult.message}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-[#4A0A2C] border border-[#F5E0EC]/20 text-xs">
                      <div>
                        <span className="text-[#F5E0EC]/60 block text-[10px]">Attendee Name</span>
                        <span className="font-bold text-[#F5E0EC]">{scanResult.booking.attendeeName}</span>
                      </div>
                      <div>
                        <span className="text-[#F5E0EC]/60 block text-[10px]">Event Title</span>
                        <span className="font-bold text-[#F5E0EC]">{scanResult.booking.eventTitle}</span>
                      </div>
                      <div>
                        <span className="text-[#F5E0EC]/60 block text-[10px]">Ticket Tier & Seats</span>
                        <span className="font-bold text-[#F5E0EC]">{scanResult.booking.tierName} ({scanResult.booking.quantity} seats)</span>
                      </div>
                      <div>
                        <span className="text-[#F5E0EC]/60 block text-[10px]">Check-In Time</span>
                        <span className="font-bold text-[#F5E0EC]">{new Date(scanResult.booking.checkedInAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {scanResult.status === 'DUPLICATE' && (
                  <div className="p-6 rounded-xl bg-[#32061D] border-2 border-[#F5E0EC]/40 text-[#F5E0EC] space-y-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-[#F5E0EC] shrink-0" />
                      <div>
                        <div className="text-xl font-bold text-[#F5E0EC]">⚠️ DUPLICATE ENTRY ATTEMPT DETECTED!</div>
                        <div className="text-xs text-[#F5E0EC]/70">{scanResult.message}</div>
                      </div>
                    </div>
                  </div>
                )}

                {scanResult.status === 'INVALID' && (
                  <div className="p-6 rounded-xl bg-[#32061D] border-2 border-[#F5E0EC]/40 text-[#F5E0EC] space-y-2">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-8 h-8 text-[#F5E0EC] shrink-0" />
                      <div>
                        <div className="text-xl font-bold text-[#F5E0EC]">🛑 INVALID TICKET / ACCESS DENIED</div>
                        <div className="text-xs text-[#F5E0EC]/70">{scanResult.message}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scan History Feed */}
          {scanHistory.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#4A0A2C] border border-[#F5E0EC]/20 space-y-4">
              <h4 className="text-sm font-bold text-[#F5E0EC] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#F5E0EC]" />
                Live Gate Scan History Feed ({scanHistory.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {scanHistory.map((scan, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#32061D] border border-[#F5E0EC]/20 text-xs font-semibold text-[#F5E0EC]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#F5E0EC]">{scan.bookingCode || scan.booking?.bookingCode}</span>
                      <span>•</span>
                      <span>{scan.status}</span>
                    </div>
                    <span className="text-[#F5E0EC]/60 text-[10px]">{scan.timestamp}</span>
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
            <h2 className="text-lg font-bold text-[#F5E0EC] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F5E0EC]" />
              Published Events Catalog ({events.length})
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-xl bg-[#F5E0EC] hover:bg-[#e7cadb] text-[#620F3C] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#620F3C]" />
              {showForm ? 'Cancel Form' : 'Publish New Event'}
            </button>
          </div>

          {/* Create Event Form Modal / Expandable Card */}
          {showForm && (
            <div className="p-6 rounded-2xl bg-[#4A0A2C] border border-[#F5E0EC]/30 space-y-4 animate-fadeIn">
              <h3 className="text-base font-bold text-[#F5E0EC]">Publish New Event with Tier Capacities</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#F5E0EC]/80 mb-1 font-semibold">Event Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#32061D] border border-[#F5E0EC]/30 text-[#F5E0EC] text-sm focus:outline-none focus:border-[#F5E0EC]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#F5E0EC]/80 mb-1 font-semibold">Venue Location</label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#32061D] border border-[#F5E0EC]/30 text-[#F5E0EC] text-sm focus:outline-none focus:border-[#F5E0EC]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#F5E0EC]/80 mb-1 font-semibold">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#32061D] border border-[#F5E0EC]/30 text-[#F5E0EC] text-sm focus:outline-none focus:border-[#F5E0EC]"
                    rows="2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#32061D] border border-[#F5E0EC]/20">
                  <div>
                    <label className="block text-[#F5E0EC]/80 mb-1 font-semibold">VIP Price (₹)</label>
                    <input
                      type="number"
                      value={vipPrice}
                      onChange={(e) => setVipPrice(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#4A0A2C] border border-[#F5E0EC]/30 text-[#F5E0EC] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#F5E0EC]/80 mb-1 font-semibold">VIP Capacity</label>
                    <input
                      type="number"
                      value={vipCapacity}
                      onChange={(e) => setVipCapacity(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#4A0A2C] border border-[#F5E0EC]/30 text-[#F5E0EC] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#F5E0EC]/80 mb-1 font-semibold">General Price (₹)</label>
                    <input
                      type="number"
                      value={genPrice}
                      onChange={(e) => setGenPrice(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#4A0A2C] border border-[#F5E0EC]/30 text-[#F5E0EC] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#F5E0EC]/80 mb-1 font-semibold">General Capacity</label>
                    <input
                      type="number"
                      value={genCapacity}
                      onChange={(e) => setGenCapacity(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#4A0A2C] border border-[#F5E0EC]/30 text-[#F5E0EC] font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#F5E0EC] hover:bg-[#e7cadb] text-[#620F3C] font-bold text-sm shadow-md cursor-pointer"
                >
                  Confirm & Create Event
                </button>
              </form>
            </div>
          )}

          {/* Events Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-[#4A0A2C] rounded-2xl overflow-hidden border border-[#F5E0EC]/25 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#F5E0EC]">{event.title}</h3>
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="p-2 rounded-xl bg-[#32061D] hover:bg-[#4A0A2C] text-[#F5E0EC]/70 border border-[#F5E0EC]/20 transition-colors cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-[#F5E0EC]/70">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#F5E0EC] shrink-0" />
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#F5E0EC] shrink-0" />
                      <span>{new Date(event.dateTime).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#F5E0EC]/20 text-xs">
                    <div className="text-[10px] font-bold text-[#F5E0EC]/60 uppercase tracking-wider">Live Inventory Status</div>
                    {event.ticketTiers.map((tier) => (
                      <div key={tier._id} className="flex justify-between items-center p-2 rounded-xl bg-[#32061D] border border-[#F5E0EC]/20">
                        <span className="font-semibold text-[#F5E0EC]">{tier.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#F5E0EC] font-bold">₹{tier.price}</span>
                          <span className="text-[#F5E0EC]/80 font-medium">{tier.availableSeats} / {tier.totalSeats} left</span>
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
    </div>
  );
}
