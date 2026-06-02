'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
  onComplete?: () => void;
}

export function CountdownTimer({ endDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        if (intervalId) clearInterval(intervalId);
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
        if (onComplete) onComplete();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false
      });
    };

    // Hitung pertama kali
    calculateTimeLeft();
    
    // Set interval hanya jika belum expired
    if (!timeLeft.isExpired) {
      intervalId = setInterval(calculateTimeLeft, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [endDate, onComplete, timeLeft.isExpired]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Rental period ended</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white rounded-xl p-3 border border-gray-200">
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4 text-[#D4AF37]" />
        <span className="text-xs text-gray-500">Time left:</span>
      </div>
      <div className="flex items-center gap-2">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="bg-[#D4AF37]/10 rounded-lg px-2 py-1 min-w-[45px]">
              <span className="font-bold text-[#D4AF37]">{timeLeft.days}</span>
            </div>
            <span className="text-[10px] text-gray-400">days</span>
          </div>
        )}
        <div className="text-center">
          <div className="bg-[#D4AF37]/10 rounded-lg px-2 py-1 min-w-[45px]">
            <span className="font-bold text-[#D4AF37]">{String(timeLeft.hours).padStart(2, '0')}</span>
          </div>
          <span className="text-[10px] text-gray-400">hrs</span>
        </div>
        <div className="text-center">
          <div className="bg-[#D4AF37]/10 rounded-lg px-2 py-1 min-w-[45px]">
            <span className="font-bold text-[#D4AF37]">{String(timeLeft.minutes).padStart(2, '0')}</span>
          </div>
          <span className="text-[10px] text-gray-400">min</span>
        </div>
        <div className="text-center">
          <div className="bg-[#D4AF37]/10 rounded-lg px-2 py-1 min-w-[45px]">
            <span className="font-bold text-[#D4AF37]">{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
          <span className="text-[10px] text-gray-400">sec</span>
        </div>
      </div>
    </div>
  );
}