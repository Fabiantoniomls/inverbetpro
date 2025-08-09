
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function RealTimeClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client-side to avoid hydration mismatch
    setTime(new Date());

    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  if (!time) {
    // You can return a placeholder or null until the time is set on the client
    return <div className="w-48 h-5 bg-muted rounded-md animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{format(time, "eeee, d 'de' MMMM", { locale: es })}</span>
      <span className="font-semibold text-foreground">{format(time, 'HH:mm:ss')}</span>
    </div>
  );
}
