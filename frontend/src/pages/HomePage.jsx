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
      {/* Hero Banner with Integrated Search & Concert Silhouette */}
      <section className="relative overflow-hidden p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#FDEEE7] via-[#FCECE3] to-[#F7D8C8] dark:from-[#1E2838] dark:via-[#16202E] dark:to-[#111823] border border-[#F5DACB] dark:border-[#283548] shadow-sm text-[#1C2434] dark:text-[#F3F5F9] transition-colors">
        {/* Concert Crowd Illustration on Right */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[42%] overflow-hidden pointer-events-none select-none">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#F7D8C8]/20 to-[#FCECE3] dark:via-[#16202E]/20 dark:to-[#16202E] z-10" />
          <svg
            className="w-full h-full object-cover opacity-80"
            viewBox="0 0 500 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="crowdGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DE5D3B" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#7E2A15" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* Stage spotlights */}
            <path d="M 270 30 L 130 360 L 440 360 Z" fill="#FFE7DC" opacity="0.45" />
            <path d="M 360 20 L 250 360 L 500 360 Z" fill="#FFDFC8" opacity="0.35" />
            {/* Stage Truss Beam */}
            <rect x="220" y="38" width="260" height="6" rx="3" fill="#A84C32" opacity="0.4" />
            <circle cx="260" cy="45" r="4" fill="#FFE2D2" />
            <circle cx="340" cy="45" r="4" fill="#FFE2D2" />
            <circle cx="420" cy="45" r="4" fill="#FFE2D2" />
            {/* Crowd Silhouettes */}
            <path
              d="M 60 360 C 70 330 85 320 100 325 C 110 305 125 295 135 305 C 145 285 155 260 165 270 C 175 285 185 310 195 320 C 205 295 215 280 230 295 C 240 270 255 240 268 255 C 280 270 290 300 300 310 C 315 280 330 265 345 285 C 360 250 375 235 390 255 C 405 275 415 305 425 315 C 440 280 460 270 475 295 C 485 270 495 285 500 305 L 500 360 L 60 360 Z"
              fill="url(#crowdGrad)"
            />
            {/* Fore-crowd silhouettes */}
            <path
              d="M 120 360 C 150 310 180 300 210 325 C 240 280 270 270 300 310 C 340 260 380 280 420 320 C 450 290 480 300 500 340 L 500 360 L 120 360 Z"
              fill="#5C1D0E"
              opacity="0.8"
            />
            {/* Raised Hands */}
            <path d="M 160 265 L 165 220 L 171 222 L 167 265 Z" fill="#8C351E" />
            <path d="M 264 250 L 270 205 L 276 207 L 271 250 Z" fill="#7E2A15" />
            <path d="M 386 250 L 392 200 L 398 203 L 393 250 Z" fill="#7E2A15" />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-[#1C2434] dark:text-[#F3F5F9] tracking-tight leading-tight">
            Discover & Book Events with Zero{' '}
            <span className="text-[#DE5D3B] dark:text-[#FF6B4A] underline decoration-[#DE5D3B]/40 dark:decoration-[#FF6B4A]/40 decoration-wavy decoration-2">
              Double-Booking
            </span>
          </h1>

          <p className="text-[#676C75] dark:text-[#94A3B8] text-sm sm:text-base leading-relaxed">
            Instant 10-minute atomic database seat holds, verified Razorpay checkout, and digital QR passes with real-time gate check-in.
          </p>

          {/* Search Bar Container */}
          <form onSubmit={handleSearchSubmit} className="pt-2 flex items-center max-w-xl">
            <div className="relative w-full flex items-center bg-white dark:bg-[#141B26] rounded-full p-1.5 pl-5 shadow-xs border border-[#EBE5DC] dark:border-[#283548] focus-within:border-[#DE5D3B] dark:focus-within:border-[#FF6B4A] transition-all">
              <Search className="w-5 h-5 text-[#9CA3AF] dark:text-[#64748B] shrink-0 mr-3" />
              <input
                type="text"
                placeholder="Search by event title, artist, or venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-[#1C2434] dark:text-[#F3F5F9] placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] text-sm font-medium focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-[#9CA3AF] dark:text-[#64748B] hover:text-[#1C2434] dark:hover:text-[#F3F5F9] p-1 cursor-pointer mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-7 py-2.5 rounded-full bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E85535] text-white text-sm font-bold cursor-pointer transition-all shadow-xs shrink-0"
              >
                Search
              </button>
            </div>
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
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#DE5D3B] dark:bg-[#FF6B4A] text-white border-[#DE5D3B] dark:border-[#FF6B4A] shadow-xs transform scale-[1.02]'
                    : 'bg-white dark:bg-[#141B26] text-[#1C2434] dark:text-[#CBD5E1] hover:text-[#DE5D3B] dark:hover:text-[#FF6B4A] border-[#EBE5DC] dark:border-[#283548] hover:border-[#DE5D3B]/40 dark:hover:border-[#FF6B4A]/40 hover:bg-[#FDF9F6] dark:hover:bg-[#1E2838] shadow-xs'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#DE5D3B] dark:text-[#FF6B4A]'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discovery Toolbar: Sort & Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-2xl bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] shadow-xs">
        {/* Left: Timeframe Quick Filters */}
        <div className="flex items-center gap-1 bg-[#FAF7F2] dark:bg-[#1E2838] p-1 rounded-full border border-[#EBE5DC]/70 dark:border-[#283548]">
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'all'
                ? 'bg-[#DE5D3B] dark:bg-[#FF6B4A] text-white shadow-xs'
                : 'text-[#676C75] dark:text-[#94A3B8] hover:text-[#1C2434] dark:hover:text-white'
            }`}
          >
            All Dates
          </button>
          <button
            onClick={() => setTimeframe('weekend')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'weekend'
                ? 'bg-[#DE5D3B] dark:bg-[#FF6B4A] text-white shadow-xs'
                : 'text-[#676C75] dark:text-[#94A3B8] hover:text-[#1C2434] dark:hover:text-white'
            }`}
          >
            This Weekend
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'month'
                ? 'bg-[#DE5D3B] dark:bg-[#FF6B4A] text-white shadow-xs'
                : 'text-[#676C75] dark:text-[#94A3B8] hover:text-[#1C2434] dark:hover:text-white'
            }`}
          >
            Next 30 Days
          </button>
        </div>

        {/* Right: Results Count & Sort Dropdown */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-[#676C75] dark:text-[#94A3B8] font-medium">
            Showing <strong className="text-[#DE5D3B] dark:text-[#FF6B4A]">{events.length}</strong> event{events.length !== 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-1.5 bg-[#FAF7F2] dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] rounded-full px-3.5 py-1.5 text-xs text-[#1C2434] dark:text-[#F3F5F9]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#DE5D3B] dark:text-[#FF6B4A]" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-[#1C2434] dark:text-[#F3F5F9] text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="date_asc" className="bg-white dark:bg-[#141B26] text-[#1C2434] dark:text-[#F3F5F9]">
                📅 Date: Soonest First
              </option>
              <option value="date_desc" className="bg-white dark:bg-[#141B26] text-[#1C2434] dark:text-[#F3F5F9]">
                📅 Date: Furthest First
              </option>
              <option value="price_asc" className="bg-white dark:bg-[#141B26] text-[#1C2434] dark:text-[#F3F5F9]">
                💰 Price: Low to High
              </option>
              <option value="price_desc" className="bg-white dark:bg-[#141B26] text-[#1C2434] dark:text-[#F3F5F9]">
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
            <div key={n} className="h-96 rounded-2xl bg-white/70 dark:bg-[#141B26]/70 border border-[#EBE5DC] dark:border-[#283548] animate-pulse"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] shadow-xs space-y-4 max-w-lg mx-auto transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] flex items-center justify-center mx-auto text-[#DE5D3B] dark:text-[#FF6B4A]">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#1C2434] dark:text-[#F3F5F9]">No matching events found</h3>
            <p className="text-xs text-[#676C75] dark:text-[#94A3B8]">
              We couldn't find any events matching your current search or filter criteria.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-full bg-[#DE5D3B] hover:bg-[#C84E2E] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
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
                className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between border border-[#EBE5DC] dark:border-[#283548] hover:border-[#DE5D3B]/40 dark:hover:border-[#FF6B4A]/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-[#141B26]"
              >
                <div>
                  {/* Banner Image with Badges */}
                  <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={event.bannerImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80'}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 dark:bg-[#141B26]/95 text-xs font-bold text-[#DE5D3B] dark:text-[#FF6B4A] border border-[#DE5D3B]/20 dark:border-[#FF6B4A]/30 backdrop-blur-md shadow-xs">
                      {event.category || 'General'}
                    </div>

                    {/* Selling Fast / Sold Out Badge */}
                    {isSoldOut ? (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-red-600 text-xs font-bold text-white shadow-xs">
                        Sold Out
                      </div>
                    ) : isSellingFast ? (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-xs font-bold text-white shadow-xs flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-white" />
                        Selling Fast
                      </div>
                    ) : null}

                    {/* Price Starting From Tag */}
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-white/95 dark:bg-[#141B26]/95 text-xs font-bold text-[#1C2434] dark:text-[#F3F5F9] border border-white/60 dark:border-[#283548] shadow-xs">
                      From <span className="text-sm font-extrabold text-[#DE5D3B] dark:text-[#FF6B4A]">₹{minPrice}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1C2434] dark:text-[#F3F5F9] line-clamp-1 mb-2 hover:text-[#DE5D3B] dark:hover:text-[#FF6B4A] transition-colors">
                        {event.title}
                      </h3>
                      <div className="space-y-1.5 text-xs text-[#676C75] dark:text-[#94A3B8]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#DE5D3B] dark:text-[#FF6B4A] shrink-0" />
                          <span className="line-clamp-1 font-medium">{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#DE5D3B] dark:text-[#FF6B4A] shrink-0" />
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
                    <div className="space-y-2 pt-2 border-t border-[#EBE5DC] dark:border-[#283548]">
                      <div className="flex justify-between text-[10px] font-bold text-[#676C75] dark:text-[#94A3B8] uppercase tracking-wider">
                        <span>Ticket Classes</span>
                        <span>{totalAvailable} seats left</span>
                      </div>
                      <div className="space-y-1.5">
                        {event.ticketTiers?.slice(0, 2).map((tier) => (
                          <div
                            key={tier._id}
                            className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548]"
                          >
                            <span className="font-bold text-[#1C2434] dark:text-[#F3F5F9]">{tier.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#DE5D3B] dark:text-[#FF6B4A] font-black">₹{tier.price}</span>
                              <span className="text-[#676C75] dark:text-[#94A3B8] text-[11px]">({tier.availableSeats} left)</span>
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
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isSoldOut
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E85535] text-white transform hover:scale-[1.01]'
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

