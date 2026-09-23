import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { MapPin, Calendar, Lock, ShieldAlert, CheckCircle2, XCircle, ArrowLeft, Sparkles, LayoutGrid } from 'lucide-react';
import VisualSeatMap from '../components/VisualSeatMap';

export default function EventDetailPage({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [holdQuantity, setHoldQuantity] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState([]);
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

    const qty = selectedSeats.length > 0 ? selectedSeats.length : Number(holdQuantity);

    try {
      const res = await client.post('/bookings/hold', {
        eventId: event._id,
        tierId: selectedTier._id,
        quantity: qty,
        selectedSeats: selectedSeats.length > 0 ? selectedSeats : [],
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
    return <div className="text-center py-20 text-[#6B617A]">Loading Event Details...</div>;
  }

  if (!event) {
    return <div className="text-center py-20 text-[#6B617A]">Event Not Found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#676C75] hover:text-[#DE5D3B] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-[#DE5D3B]" />
        Back to Events Catalog
      </button>

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

      <div className="glass-card rounded-3xl overflow-hidden border border-[#EBE5DC] shadow-xs bg-white">
        <div className="relative h-64 overflow-hidden bg-gray-100">
          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/95 text-xs font-bold text-[#DE5D3B] border border-[#DE5D3B]/20 shadow-xs backdrop-blur-md">
            {event.category}
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C2434] mb-2">{event.title}</h1>
            <p className="text-[#676C75] text-sm leading-relaxed">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EBE5DC] text-xs">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#DE5D3B] shrink-0" />
              <div>
                <div className="text-[#676C75]">Venue Location</div>
                <div className="font-bold text-[#1C2434] text-sm">{event.venue}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#DE5D3B] shrink-0" />
              <div>
                <div className="text-[#676C75]">Event Date & Time</div>
                <div className="font-bold text-[#1C2434] text-sm">
                  {new Date(event.dateTime).toLocaleDateString()} at {new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Tier Selection */}
          <div className="space-y-4 pt-4 border-t border-[#EBE5DC]">
            <h3 className="text-sm font-bold text-[#1C2434] uppercase tracking-wider">Select Ticket Tier</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.ticketTiers.map((tier) => (
                <div
                  key={tier._id}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                    selectedTier?._id === tier._id
                      ? 'bg-[#FDF2EC] border-2 border-[#DE5D3B] shadow-xs'
                      : 'bg-white border border-[#EBE5DC] hover:border-[#DE5D3B]/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#1C2434] text-sm">{tier.name}</span>
                    <span className="text-[#DE5D3B] font-black text-sm">₹{tier.price}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#676C75]">
                    <span>Available Capacity:</span>
                    <span className="font-bold text-[#1C2434]">
                      {tier.availableSeats} of {tier.totalSeats} seats
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedTier && (
              <div className="space-y-6 pt-2">
                {/* Interactive Visual Seat Map */}
                <VisualSeatMap
                  tier={selectedTier}
                  onSelectionChange={(seats) => {
                    setSelectedSeats(seats);
                    if (seats.length > 0) {
                      setHoldQuantity(seats.length);
                    }
                  }}
                />

                <div className="p-6 rounded-2xl glass-panel border border-[#EBE5DC] space-y-4 bg-white">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-[#676C75]">
                      Tier: <span className="text-[#1C2434] font-bold">{selectedTier.name}</span> (₹{selectedTier.price}/seat)
                    </span>
                    <span className="text-[#DE5D3B] font-bold">{selectedTier.availableSeats} Seats Available</span>
                  </div>

                  {selectedSeats.length === 0 ? (
                    <div>
                      <label className="block text-xs text-[#676C75] mb-1.5 font-medium">
                        Or enter Quantity manually (if not picking seats on map):
                      </label>
                      <input
                        type="number"
                        value={holdQuantity}
                        onChange={(e) => setHoldQuantity(e.target.value)}
                        min="1"
                        max={selectedTier.availableSeats}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#EBE5DC] text-[#1C2434] font-mono text-base font-bold focus:outline-none focus:border-[#DE5D3B]"
                      />
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EBE5DC] flex items-center justify-between text-xs">
                      <span className="text-[#676C75]">Assigned Seats on Map:</span>
                      <span className="font-mono font-bold text-[#DE5D3B]">{selectedSeats.join(', ')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm border-t border-[#EBE5DC] pt-3">
                    <span className="text-[#676C75] font-medium">Total Order Amount:</span>
                    <span className="text-2xl font-extrabold text-[#DE5D3B]">
                      ₹{selectedTier.price * (selectedSeats.length > 0 ? selectedSeats.length : holdQuantity)}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleHoldSeats}
                      disabled={selectedTier.availableSeats === 0}
                      className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
                        selectedTier.availableSeats === 0
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                          : 'bg-[#DE5D3B] hover:bg-[#C84E2E] text-white cursor-pointer transform hover:scale-[1.01]'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      {selectedTier.availableSeats === 0
                        ? 'Tier Sold Out'
                        : `Lock ${selectedSeats.length > 0 ? selectedSeats.length : holdQuantity} Seat(s) for 10 Minutes`}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSeats([]);
                        setHoldQuantity(selectedTier.availableSeats + 5);
                      }}
                      className="w-full py-2 rounded-xl bg-white hover:bg-gray-50 text-[#676C75] border border-gray-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-[#676C75]" />
                      Simulate Over-Hold Test (+5 Over Capacity)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
