import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const HoldTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - new Date().getTime();
      const seconds = Math.max(0, Math.floor(diff / 1000));
      
      if (seconds === 0 && onExpire) {
        onExpire();
      }
      return seconds;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  const isUrgent = timeLeft > 0 && timeLeft < 120;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm ${
      isUrgent
        ? 'bg-amber-100 text-amber-900 border border-amber-400 animate-pulse'
        : 'bg-[#FAF7F2] text-[#DE5D3B] border border-[#DE5D3B]/20'
    }`}>
      {isUrgent ? <AlertTriangle className="w-4 h-4 text-amber-700" /> : <Clock className="w-4 h-4 text-[#DE5D3B]" />}
      <span>Hold Expires in: <span className="font-mono text-base ml-1 font-black tracking-wider">{formattedTime}</span></span>
    </div>
  );
};

export default HoldTimer;
