import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative p-2 rounded-xl border border-[#EBE5DC] dark:border-[#283548] bg-white dark:bg-[#141B26] hover:bg-[#FAF7F2] dark:hover:bg-[#1E2838] text-[#DE5D3B] dark:text-[#FF6B4A] transition-all duration-200 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#DE5D3B]/40"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 rotate-0 scale-100 transition-all duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-[#DE5D3B] rotate-0 scale-100 transition-all duration-300" />
        )}
      </div>
    </button>
  );
}
