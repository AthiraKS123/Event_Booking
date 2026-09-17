import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import {
  MapPin,
  Calendar,
  Search,
  Ticket,
  Sparkles,
  SlidersHorizontal,
  X,
  Flame,
  ArrowUpDown,
  Music,
  Cpu,
  Mic,
  Wrench,
  Trophy,
  Smile,
  Layers,
} from 'lucide-react';

const CATEGORIES = [
  { name: 'All', icon: Sparkles },
  { name: 'Music', icon: Music },
  { name: 'Tech', icon: Cpu },
  { name: 'Conference', icon: Mic },
  { name: 'Workshop', icon: Wrench },
  { name: 'Sports', icon: Trophy },
  { name: 'Comedy', icon: Smile },
  { name: 'Other', icon: Layers },
];

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date_asc');
  const [timeframe, setTimeframe] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [category, sort, timeframe]);

  const fetchEvents = async (customSearch = search) => {
    try {
      setLoading(true);
      let url = '/events';
      const params = new URLSearchParams();

      if (category !== 'All') params.append('category', category);
      if (customSearch && customSearch.trim()) params.append('search', customSearch.trim());
      if (sort) params.append('sort', sort);
      if (timeframe !== 'all') params.append('timeframe', timeframe);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await client.get(url);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchEvents('');
  };

  const handleResetFilters = () => {
    setCategory('All');
    setSearch('');
    setSort('date_asc');
    setTimeframe('all');
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner with Integrated Search */}
      <section className="relative overflow-hidden p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#620F3C] via-[#78144b] to-[#4A0A2C] border border-[#620F3C]/30 shadow-2xl text-white">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-white border border-white/25 text-xs font-bold tracking-wide backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            Live High-Concurrency Ticketing Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Discover & Book Events with <span className="underline decoration-white/60 decoration-wavy decoration-2">Zero Double-Booking</span>
          </h1>

          <p className="text-white/85 text-sm sm:text-base leading-relaxed">
            Instant 10-minute atomic database seat holds, verified Razorpay checkout, and digital QR passes with real-time gate check-in.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-white/70 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search by event title, artist, or venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/15 border-2 border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:bg-white focus:text-[#2A081C] focus:placeholder:text-gray-400 focus:border-white shadow-inner transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3.5 top-3.5 text-white/70 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-[#F5E0EC] hover:bg-white text-[#620F3C] text-sm font-extrabold cursor-pointer transition-all shadow-lg transform hover:scale-[1.02]"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Category Filter Chips */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#620F3C] text-white border-[#620F3C] shadow-md transform scale-[1.03]'
                    : 'bg-white text-[#2A081C]/80 hover:text-[#620F3C] border-[#620F3C]/15 hover:border-[#620F3C]/40 shadow-sm'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#620F3C]'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discovery Toolbar: Sort & Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#620F3C]/15 shadow-sm">
        {/* Left: Timeframe Quick Filters */}
        <div className="flex items-center gap-1.5 bg-[#FAF6F9] p-1 rounded-xl border border-[#620F3C]/10">
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'all'
                ? 'bg-[#620F3C] text-white shadow-sm'
                : 'text-[#6E455E] hover:text-[#620F3C]'
            }`}
          >
            All Dates
          </button>
          <button
            onClick={() => setTimeframe('weekend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'weekend'
                ? 'bg-[#620F3C] text-white shadow-sm'
                : 'text-[#6E455E] hover:text-[#620F3C]'
            }`}
          >
            This Weekend
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'month'
                ? 'bg-[#620F3C] text-white shadow-sm'
                : 'text-[#6E455E] hover:text-[#620F3C]'
            }`}
          >
            Next 30 Days
          </button>
        </div>

        {/* Right: Results Count & Sort Dropdown */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-[#6E455E] font-medium">
            Showing <strong className="text-[#2A081C]">{events.length}</strong> event{events.length !== 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-1.5 bg-[#FAF6F9] border border-[#620F3C]/20 rounded-xl px-3 py-1.5 text-xs text-[#2A081C]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#620F3C]" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-[#2A081C] text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="date_asc" className="bg-white text-[#2A081C]">
                📅 Date: Soonest First
              </option>
              <option value="date_desc" className="bg-white text-[#2A081C]">
                📅 Date: Furthest First
              </option>
              <option value="price_asc" className="bg-white text-[#2A081C]">
                💰 Price: Low to High
              </option>
              <option value="price_desc" className="bg-white text-[#2A081C]">
                💎 Price: High to Low
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton / State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-white/70 border border-[#620F3C]/10 animate-pulse"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-white border border-[#620F3C]/15 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF6F9] border border-[#620F3C]/20 flex items-center justify-center mx-auto text-[#620F3C]">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#2A081C]">No matching events found</h3>
            <p className="text-xs text-[#6E455E]">
              We couldn't find any events matching your current search or filter criteria.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-[#620F3C] hover:bg-[#4E0B2F] text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        /* Events Catalog Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            // Calculate total seats and remaining seats across tiers
            const totalAvailable = event.ticketTiers?.reduce((sum, t) => sum + (t.availableSeats || 0), 0) || 0;
            const totalCapacity = event.ticketTiers?.reduce((sum, t) => sum + (t.totalSeats || 0), 0) || 1;
            const isSellingFast = totalAvailable > 0 && totalAvailable / totalCapacity <= 0.3;
            const isSoldOut = totalAvailable === 0;

            // Find minimum starting price
            const minPrice = event.ticketTiers?.length
              ? Math.min(...event.ticketTiers.map((t) => t.price))
              : 0;

            return (
              <div
                key={event._id}
                className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between border border-[#620F3C]/12 hover:border-[#620F3C]/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div>
                  {/* Banner Image with Badges */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={event.bannerImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80'}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-xs font-bold text-[#620F3C] border border-[#620F3C]/20 backdrop-blur-md shadow-sm">
                      {event.category || 'General'}
                    </div>

                    {/* Selling Fast / Sold Out Badge */}
                    {isSoldOut ? (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-red-600 text-xs font-bold text-white shadow-sm">
                        Sold Out
                      </div>
                    ) : isSellingFast ? (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-xs font-bold text-white shadow-sm flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-white" />
                        Selling Fast
                      </div>
                    ) : null}

                    {/* Price Starting From Tag */}
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-white/95 text-xs font-bold text-[#2A081C] border border-white/60 shadow-sm">
                      From <span className="text-sm font-extrabold text-[#620F3C]">₹{minPrice}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#2A081C] line-clamp-1 mb-2 hover:text-[#620F3C] transition-colors">
                        {event.title}
                      </h3>
                      <div className="space-y-1.5 text-xs text-[#6E455E]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#620F3C] shrink-0" />
                          <span className="line-clamp-1 font-medium">{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#620F3C] shrink-0" />
                          <span className="font-medium">
                            {new Date(event.dateTime).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at{' '}
                            {new Date(event.dateTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Tiers Preview */}
                    <div className="space-y-2 pt-2 border-t border-[#620F3C]/10">
                      <div className="flex justify-between text-[10px] font-bold text-[#6E455E] uppercase tracking-wider">
                        <span>Ticket Classes</span>
                        <span>{totalAvailable} seats left</span>
                      </div>
                      <div className="space-y-1.5">
                        {event.ticketTiers?.slice(0, 2).map((tier) => (
                          <div
                            key={tier._id}
                            className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#FAF6F9] border border-[#620F3C]/10"
                          >
                            <span className="font-bold text-[#2A081C]">{tier.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#620F3C] font-black">₹{tier.price}</span>
                              <span className="text-[#6E455E] text-[11px]">({tier.availableSeats} left)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    to={`/events/${event._id}`}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                      isSoldOut
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#620F3C] hover:bg-[#4E0B2F] text-white transform hover:scale-[1.01]'
                    }`}
                  >
                    <Ticket className="w-4 h-4" />
                    {isSoldOut ? 'Event Sold Out' : 'Select Seats & Hold'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
