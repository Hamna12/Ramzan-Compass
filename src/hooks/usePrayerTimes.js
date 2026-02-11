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

            // Auto-select method based on countryCode from coords
            // If Jafri, strictly use Tehran method (Shia Ithna-Ashari standard)
            // Tehran method uses a 4.5 degree Maghrib angle for the required safety margin.
            const params = madhab === 'Jafri'
                ? CalculationMethod.Tehran()
                : getMethodForCountry(coords.countryCode);

            // Set Madhab (Asr)
            // Hanafi: Uses 2 shadows rule
            // Jafri/Standard: Uses 1 shadow rule (Adhan's Shafi/Standard)
            params.madhab = madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;

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

                // Helper to get tomorrow's times
                const getTomorrowTimes = () => {
                    const tomorrow = new Date(date);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return new PrayerTimes(coordinates, tomorrow, params);
                };

                let event = null;

                if (mode === 'aftari') {
                    // Always show Aftari
                    if (now < times.maghrib) {
                        event = { type: 'AFTARI', time: times.maghrib };
                    } else {
                        const tomorrowTimes = getTomorrowTimes();
                        event = { type: 'AFTARI', time: tomorrowTimes.maghrib };
                    }
                } else if (mode === 'sehri') {
                    // Always show Sehri
                    if (now < times.fajr) {
                        event = { type: 'SEHRI', time: times.fajr };
                    } else {
                        const tomorrowTimes = getTomorrowTimes();
                        event = { type: 'SEHRI', time: tomorrowTimes.fajr };
                    }
                } else {
                    // Automatic (closest next event)
                    if (now < times.fajr) {
                        event = { type: 'SEHRI', time: times.fajr };
                    } else if (now < times.maghrib) {
                        event = { type: 'AFTARI', time: times.maghrib };
                    } else {
                        const tomorrowTimes = getTomorrowTimes();
                        event = { type: 'SEHRI', time: tomorrowTimes.fajr };
                    }
                }

                setNextEvent(event);

            } catch (e) {
                console.error("Error calculating prayer times", e);
            }
        };

        calculateTimes();
        const interval = setInterval(calculateTimes, 60000);
        return () => clearInterval(interval);
    }, [coords, madhab]);

    return { prayerTimes, nextEvent };
};
