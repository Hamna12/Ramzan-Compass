import { useState, useEffect } from 'react';
import { intervalToDuration } from 'date-fns';

export const useCountdown = (targetDate) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!targetDate) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            if (now >= targetDate) {
                setTimeLeft(null); // Time's up
                return;
            }

            const duration = intervalToDuration({
                start: now,
                end: targetDate,
            });

            // format as HH:MM:SS
            // date-fns intervalToDuration returns { hours, minutes, seconds } (and days, months etc)
            // We might want total hours if it's more than 24h, but for Ramzan daily cycle, usually < 24h.
            // However, if we are counting down to Ramzan start, it might be days.
            // For this specific 'Aftari/Sehri' countdown, it's usually < 24h.

            setTimeLeft(duration);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return timeLeft;
};
