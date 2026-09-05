import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, User, ShieldCheck, Clock, LogOut } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  return (
    <header className="sticky top-0 z-40 bg-[#620F3C] border-b border-[#F5E0EC]/25 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#F5E0EC] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5 text-[#620F3C]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#F5E0EC]">EventBook</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-[#F5E0EC]/80 hover:text-[#F5E0EC] transition-colors">
            Browse Events
          </Link>
          {currentUser && (
            <>
              <Link to="/my-holds" className="text-[#F5E0EC]/80 hover:text-[#F5E0EC] transition-colors flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#F5E0EC]" />
                My Active Holds
              </Link>
              <Link to="/my-tickets" className="text-[#F5E0EC]/80 hover:text-[#F5E0EC] transition-colors flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#F5E0EC]" />
                My Tickets
              </Link>
            </>
          )}
          {currentUser?.role === 'admin' && (
            <Link to="/admin/events" className="text-[#F5E0EC] hover:underline transition-colors flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#F5E0EC]" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#4A0A2C] border border-[#F5E0EC]/30 text-xs">
                <User className="w-3.5 h-3.5 text-[#F5E0EC]" />
                <span className="font-semibold text-[#F5E0EC]">{currentUser.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#F5E0EC]/20 text-[#F5E0EC] border border-[#F5E0EC]/40">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-[#4A0A2C] hover:bg-[#32061D] text-[#F5E0EC] border border-[#F5E0EC]/30 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-[#4A0A2C] hover:bg-[#32061D] text-[#F5E0EC] text-xs font-bold border border-[#F5E0EC]/30 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-[#F5E0EC] hover:bg-[#e7cadb] text-[#620F3C] text-xs font-bold transition-all"
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
