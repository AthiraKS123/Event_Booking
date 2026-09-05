import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { MapPin, Calendar, Lock, ShieldAlert, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export default function EventDetailPage({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [holdQuantity, setHoldQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/events/${id}`);
      setEvent(res.data.event);
      if (res.data.event?.ticketTiers?.length > 0) {
        setSelectedTier(res.data.event.ticketTiers[0]);
      }
    } catch (err) {
      setErrorMsg('Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handleHoldSeats = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await client.post('/bookings/hold', {
        eventId: event._id,
        tierId: selectedTier._id,
        quantity: Number(holdQuantity),
      });

      setSuccessMsg(`🔒 ${res.data.message}`);
      setTimeout(() => {
        navigate('/my-holds');
      }, 1500);
    } catch (err) {
      setErrorMsg(`🛑 ATOMIC REJECTION: ${err.response?.data?.message || 'Failed to hold seats'}`);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-[#efdecd]/80">Loading Event Details...</div>;
  }

  if (!event) {
    return <div className="text-center py-20 text-[#efdecd]/60">Event Not Found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#F5E0EC]/80 hover:text-[#F5E0EC] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-[#F5E0EC]" />
        Back to Events Catalog
      </button>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#4A0A2C] border border-[#F5E0EC]/30 text-[#F5E0EC] flex items-center gap-3">
          <XCircle className="w-5 h-5 text-[#F5E0EC]/70 shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-[#4A0A2C] border border-[#F5E0EC]/50 text-[#F5E0EC] flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#F5E0EC] shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden border border-[#F5E0EC]/25">
        <div className="relative h-64 overflow-hidden bg-[#620F3C]">
          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover opacity-90" />
          <div className="absolute top-4 right-4 px-3 py-1 rounded bg-[#620F3C]/90 text-xs font-semibold text-[#F5E0EC] border border-[#F5E0EC]/30">
            {event.category}
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#F5E0EC] mb-2">{event.title}</h1>
            <p className="text-[#F5E0EC]/80 text-sm leading-relaxed">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#620F3C] border border-[#F5E0EC]/20 text-xs">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#F5E0EC] shrink-0" />
              <div>
                <div className="text-[#F5E0EC]/60">Venue Location</div>
                <div className="font-semibold text-[#F5E0EC] text-sm">{event.venue}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#F5E0EC] shrink-0" />
              <div>
                <div className="text-[#F5E0EC]/60">Event Date & Time</div>
                <div className="font-semibold text-[#F5E0EC] text-sm">
                  {new Date(event.dateTime).toLocaleDateString()} at {new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Tier Selection */}
          <div className="space-y-4 pt-4 border-t border-[#F5E0EC]/20">
            <h3 className="text-sm font-bold text-[#F5E0EC] uppercase tracking-wider">Select Ticket Tier</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.ticketTiers.map((tier) => (
                <div
                  key={tier._id}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    selectedTier?._id === tier._id
                      ? 'bg-[#F5E0EC]/15 border-[#F5E0EC]'
                      : 'bg-[#620F3C] border-[#F5E0EC]/20 hover:border-[#F5E0EC]/60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#F5E0EC] text-sm">{tier.name}</span>
                    <span className="text-[#F5E0EC] font-bold text-sm">₹{tier.price}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#F5E0EC]/60">
                    <span>Available Capacity:</span>
                    <span className="font-medium text-[#F5E0EC]">
                      {tier.availableSeats} of {tier.totalSeats} seats
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedTier && (
              <div className="p-6 rounded-xl glass-panel border border-[#F5E0EC]/30 space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-[#F5E0EC]/80">Selected Tier: <span className="text-[#F5E0EC] font-bold">{selectedTier.name}</span></span>
                  <span className="text-[#F5E0EC] font-semibold">{selectedTier.availableSeats} Seats Available</span>
                </div>

                <div>
                  <label className="block text-xs text-[#F5E0EC]/70 mb-1.5 font-medium">Hold Quantity:</label>
                  <input
                    type="number"
                    value={holdQuantity}
                    onChange={(e) => setHoldQuantity(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#620F3C] border border-[#F5E0EC]/30 text-[#F5E0EC] font-mono text-base font-bold"
                  />
                </div>

                <div className="flex justify-between items-center text-sm border-t border-[#F5E0EC]/20 pt-3">
                  <span className="text-[#F5E0EC]/80">Total Price:</span>
                  <span className="text-xl font-bold text-[#F5E0EC]">₹{selectedTier.price * holdQuantity}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleHoldSeats}
                    className="w-full py-3 rounded-xl bg-[#F5E0EC] hover:bg-[#e7cadb] text-[#620F3C] font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-[#620F3C]" />
                    Confirm Seat Hold (10-Min Atomic Lock)
                  </button>

                  <button
                    onClick={() => setHoldQuantity(selectedTier.availableSeats + 5)}
                    className="w-full py-2 rounded-xl bg-[#620F3C] hover:bg-[#4A0A2C] text-[#F5E0EC]/80 border border-[#F5E0EC]/30 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#F5E0EC]/70" />
                    Simulate Over-Hold Test (+5 Over Capacity)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
