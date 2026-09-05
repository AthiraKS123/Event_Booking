import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { MapPin, Calendar, Search, Ticket } from 'lucide-react';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let url = '/events';
      const params = new URLSearchParams();
      if (category !== 'All') params.append('category', category);
      if (search) params.append('search', search);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await client.get(url);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const categories = ['All', 'Music', 'Tech', 'Conference', 'Workshop', 'Sports', 'Other'];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="p-8 sm:p-10 rounded-2xl bg-[#4A0A2C] border border-[#F5E0EC]/30 shadow-lg">
        <div className="max-w-2xl space-y-3">
          <div className="inline-block px-3 py-1 rounded-md bg-[#F5E0EC]/15 text-[#F5E0EC] border border-[#F5E0EC]/30 text-xs font-semibold">
            Live High-Concurrency Event Booking
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#F5E0EC] tracking-tight">
            Reserve Seats with <span className="text-[#F5E0EC] underline decoration-[#F5E0EC]/50">Zero Double-Booking</span>
          </h1>
          <p className="text-[#F5E0EC]/80 text-sm">
            Select ticket tiers, hold seats with 10-minute atomic database locks, and pay securely.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#F5E0EC]/60 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search events by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#620F3C] border border-[#F5E0EC]/30 text-[#F5E0EC] text-sm focus:outline-none focus:border-[#F5E0EC]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#F5E0EC] hover:bg-[#e7cadb] text-[#620F3C] text-sm font-bold cursor-pointer transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              category === cat
                ? 'bg-[#F5E0EC] text-[#620F3C] font-bold'
                : 'bg-[#4A0A2C] text-[#F5E0EC]/80 hover:text-[#F5E0EC] border border-[#F5E0EC]/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event._id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-[#F5E0EC]/25">
            <div>
              <div className="relative h-48 overflow-hidden bg-[#620F3C]">
                <img
                  src={event.bannerImage}
                  alt={event.title}
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded bg-[#620F3C]/90 text-xs font-semibold text-[#F5E0EC] border border-[#F5E0EC]/30">
                  {event.category}
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#F5E0EC] mb-2">{event.title}</h3>
                  <div className="space-y-1 text-xs text-[#F5E0EC]/70">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#F5E0EC] shrink-0" />
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#F5E0EC] shrink-0" />
                      <span>{new Date(event.dateTime).toLocaleDateString()} at {new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Tiers Preview */}
                <div className="space-y-2 pt-2 border-t border-[#F5E0EC]/20">
                  <div className="text-[10px] font-bold text-[#F5E0EC]/60 uppercase tracking-wider">Ticket Tiers</div>
                  {event.ticketTiers.map((tier) => (
                    <div key={tier._id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#620F3C] border border-[#F5E0EC]/20">
                      <span className="font-semibold text-[#F5E0EC]">{tier.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#F5E0EC] font-bold">₹{tier.price}</span>
                        <span className="text-[#F5E0EC]/60 font-medium">
                          ({tier.availableSeats} left)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <Link
                to={`/events/${event._id}`}
                className="w-full py-2.5 rounded-xl bg-[#F5E0EC] hover:bg-[#e7cadb] text-[#620F3C] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-[#620F3C]" />
                View Details & Hold Seats
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
