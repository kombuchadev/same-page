import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/firebaseConfig';

interface UseTimerResult {
  secondsLeft: number;
  isExpired: boolean;
}

export function useTimer(timerEndsAt: number | null): UseTimerResult {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const serverOffsetRef = useRef(0);

  // Get server time offset once
  useEffect(() => {
    const offsetRef = ref(db, '.info/serverTimeOffset');
    const unsub = onValue(offsetRef, (snap) => {
      serverOffsetRef.current = snap.val() ?? 0;
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!timerEndsAt) {
      setSecondsLeft(0);
      setIsExpired(false);
      return;
    }

    const tick = () => {
      const serverNow = Date.now() + serverOffsetRef.current;
      const remaining = Math.max(0, Math.ceil((timerEndsAt - serverNow) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
      } else {
        setIsExpired(false);
      }
    };

    tick(); // run immediately
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [timerEndsAt]);

  return { secondsLeft, isExpired };
}
