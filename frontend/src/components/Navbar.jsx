import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, User, ShieldCheck, Clock, LogOut } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#620F3C]/12 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#620F3C] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-[#620F3C]">EventBook</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-[#2A081C]/80 hover:text-[#620F3C] font-semibold transition-colors">
            Browse Events
          </Link>
          {currentUser && (
            <>
              <Link to="/my-holds" className="text-[#2A081C]/80 hover:text-[#620F3C] font-medium transition-colors flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#620F3C]" />
                My Active Holds
              </Link>
              <Link to="/my-tickets" className="text-[#2A081C]/80 hover:text-[#620F3C] font-medium transition-colors flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#620F3C]" />
                My Tickets
              </Link>
            </>
          )}
          {currentUser?.role === 'admin' && (
            <Link to="/admin/events" className="text-[#620F3C] hover:underline transition-colors flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#620F3C]" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF6F9] border border-[#620F3C]/20 text-xs">
                <User className="w-3.5 h-3.5 text-[#620F3C]" />
                <span className="font-bold text-[#2A081C]">{currentUser.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-[#620F3C] text-white">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-[#FAF6F9] hover:bg-[#F5E0EC] text-[#620F3C] border border-[#620F3C]/20 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-[#FAF6F9] hover:bg-[#F5E0EC] text-[#620F3C] text-xs font-bold border border-[#620F3C]/25 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-[#620F3C] hover:bg-[#4E0B2F] text-white text-xs font-bold shadow-sm transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
