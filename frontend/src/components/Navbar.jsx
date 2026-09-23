import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, User, ShieldCheck, Clock, LogOut } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EBE5DC] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#DE5D3B] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-[#1C2434]">
              <span className="sr-only">EventBook</span>
              <span aria-hidden="true">Event<span className="text-[#DE5D3B]">Book</span></span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-[#1C2434] hover:text-[#DE5D3B] font-semibold transition-colors">
            Browse Events
          </Link>
          {currentUser && (
            <>
              <Link to="/my-holds" className="text-[#1C2434] hover:text-[#DE5D3B] font-medium transition-colors flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#DE5D3B]" />
                My Active Holds
              </Link>
              <Link to="/my-tickets" className="text-[#1C2434] hover:text-[#DE5D3B] font-medium transition-colors flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#DE5D3B]" />
                My Tickets
              </Link>
            </>
          )}
          {currentUser?.role === 'admin' && (
            <Link to="/admin/events" className="text-[#DE5D3B] hover:underline transition-colors flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#DE5D3B]" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#EBE5DC] shadow-xs text-xs">
                <User className="w-3.5 h-3.5 text-[#DE5D3B]" />
                <span className="font-bold text-[#1C2434]">{currentUser.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-[#DE5D3B] text-white">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#DE5D3B] border border-[#EBE5DC] transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#FDF2EC] text-[#DE5D3B] text-xs font-bold border border-[#DE5D3B]/30 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] text-white text-xs font-bold shadow-sm transition-all"
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
