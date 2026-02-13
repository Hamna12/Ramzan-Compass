import { useState, useEffect } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

const getMethodForCountry = (countryCode) => {
    if (!countryCode) return CalculationMethod.MoonsightingCommittee();

    switch (countryCode) {
        case 'PK':
        case 'IN':
        case 'BD':
            return CalculationMethod.Karachi();
        case 'US':
        case 'CA':
            return CalculationMethod.NorthAmerica();
        case 'EG':
            return CalculationMethod.Egyptian();
        case 'SA':
            return CalculationMethod.UmmAlQura();
        case 'AE':
        case 'QA':
        case 'KW':
            return CalculationMethod.Gulf();
        case 'SG':
            return CalculationMethod.Singapore();
        case 'TR':
            return CalculationMethod.Turkey();
        case 'GB':
        case 'FR':
        case 'DE':
            return CalculationMethod.MuslimWorldLeague();
        default:
            return CalculationMethod.MoonsightingCommittee();
    }
};

export const usePrayerTimes = (coords, settings = {}) => {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextEvent, setNextEvent] = useState(null);

    const { madhab = 'Hanafi' } = settings;

    useEffect(() => {
        if (!coords) return;

        const calculateTimes = () => {
            const coordinates = new Coordinates(coords.latitude, coords.longitude);
            const date = new Date();

            // Custom precise parameters for 2026 accuracy
            let params;
            if (madhab === 'Jafri') {
                // Jafri (Precision Nightfall / Eastern Redness)
                // Nightfall starts 4 degrees after sunset (Shia Ithna-Ashari standard)
                params = CalculationMethod.Tehran();
                params.fajrAngle = 16.0;
                params.maghribAngle = 4.0;
                params.ishaAngle = 14.0;
                params.madhab = Madhab.Shafi; // Jafri uses 1 shadow rule
            } else {
                // Hanafi (Karachi/UISK Method - South Asian Standard)
                params = CalculationMethod.Karachi();
                params.fajrAngle = 18.0;
                params.ishaAngle = 18.0;
                params.madhab = Madhab.Hanafi; // Hanafi uses 2 shadows rule
            }

            try {
                const times = new PrayerTimes(coordinates, date, params);

                setPrayerTimes({
                    fajr: times.fajr,
                    sunrise: times.sunrise,
                    dhuhr: times.dhuhr,
                    asr: times.asr,
                    maghrib: times.maghrib,
                    isha: times.isha,
                });

                const now = new Date();
                const mode = settings.countdownMode || 'auto';
                const ROLLOVER_DELAY_MS = 1200000; // 20 minutes delay before switching to next event

                // Helper to get tomorrow's times
                const getTomorrowTimes = () => {
                    const tomorrow = new Date(date);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return new PrayerTimes(coordinates, tomorrow, params);
                };

                // Helper to check if we are in the "rollover window" of an event
                // This keeps the event active even if it JUST passed
                const isWithinRollover = (eventTime) => {
                    const diff = now.getTime() - eventTime.getTime();
                    return diff >= 0 && diff < ROLLOVER_DELAY_MS;
                };

                let event = null;

                if (mode === 'aftari') {
                    // Always show Aftari
                    if (now < times.maghrib || isWithinRollover(times.maghrib)) {
                        event = { type: 'AFTARI', time: times.maghrib };
                    } else {
                        const tomorrowTimes = getTomorrowTimes();
                        event = { type: 'AFTARI', time: tomorrowTimes.maghrib };
                    }
                } else if (mode === 'sehri') {
                    // Always show Sehri
                    if (now < times.fajr || isWithinRollover(times.fajr)) {
                        event = { type: 'SEHRI', time: times.fajr };
                    } else {
                        const tomorrowTimes = getTomorrowTimes();
                        event = { type: 'SEHRI', time: tomorrowTimes.fajr };
                    }
                } else {
                    // Automatic (closest next event)
                    if (now < times.fajr || isWithinRollover(times.fajr)) {
                        event = { type: 'SEHRI', time: times.fajr };
                    } else if (now < times.maghrib || isWithinRollover(times.maghrib)) {
                        event = { type: 'AFTARI', time: times.maghrib };
                    } else {
                        const tomorrowTimes = getTomorrowTimes();
                        event = { type: 'SEHRI', time: tomorrowTimes.fajr };
                    }
                }

                setNextEvent(prev => {
                    if (prev && prev.type === event.type && prev.time.getTime() === event.time.getTime()) {
                        return prev;
                    }
                    return event;
                });

            } catch (e) {
                console.error("Error calculating prayer times", e);
            }
        };

        calculateTimes();
        const interval = setInterval(calculateTimes, 1000); // Check every second for smoother rollover transitions
        return () => clearInterval(interval);
    }, [coords, madhab, settings.countdownMode]);

    return { prayerTimes, nextEvent };
};
