import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, User, ShieldCheck, Clock, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ currentUser, onLogout }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#141B26]/95 backdrop-blur-md border-b border-[#EBE5DC] dark:border-[#283548] shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#DE5D3B] dark:bg-[#FF6B4A] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-[#1C2434] dark:text-[#F3F5F9]">
              <span className="sr-only">EventBook</span>
              <span aria-hidden="true">Event<span className="text-[#DE5D3B] dark:text-[#FF6B4A]">Book</span></span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-[#1C2434] dark:text-[#CBD5E1] hover:text-[#DE5D3B] dark:hover:text-[#FF6B4A] font-semibold transition-colors">
            Browse Events
          </Link>
          {currentUser && (
            <>
              <Link to="/my-holds" className="text-[#1C2434] dark:text-[#CBD5E1] hover:text-[#DE5D3B] dark:hover:text-[#FF6B4A] font-medium transition-colors flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#DE5D3B] dark:text-[#FF6B4A]" />
                My Active Holds
              </Link>
              <Link to="/my-tickets" className="text-[#1C2434] dark:text-[#CBD5E1] hover:text-[#DE5D3B] dark:hover:text-[#FF6B4A] font-medium transition-colors flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#DE5D3B] dark:text-[#FF6B4A]" />
                My Tickets
              </Link>
            </>
          )}
          {currentUser?.role === 'admin' && (
            <Link to="/admin/events" className="text-[#DE5D3B] dark:text-[#FF6B4A] hover:underline transition-colors flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#DE5D3B] dark:text-[#FF6B4A]" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Right side: Theme Toggle & Auth Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />

          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] shadow-xs text-xs">
                <User className="w-3.5 h-3.5 text-[#DE5D3B] dark:text-[#FF6B4A]" />
                <span className="font-bold text-[#1C2434] dark:text-[#F3F5F9]">{currentUser.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-[#DE5D3B] dark:bg-[#FF6B4A] text-white">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2838] hover:bg-[#F3ECE1] dark:hover:bg-[#283548] text-[#DE5D3B] dark:text-[#FF6B4A] border border-[#EBE5DC] dark:border-[#283548] transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2838] hover:bg-[#FDF2EC] dark:hover:bg-[#283548] text-[#DE5D3B] dark:text-[#FF6B4A] text-xs font-bold border border-[#DE5D3B]/30 dark:border-[#FF6B4A]/30 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E85535] text-white text-xs font-bold shadow-sm transition-all"
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

