import React, { useMemo } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

const RamzanCalendar = ({ coords, settings }) => {
    const calendarData = useMemo(() => {
        if (!coords) return [];

        const days = [];
        // Approximate start of Ramzan 1447 (around Feb 18, 2026)
        const startDate = new Date(2026, 1, 18); // Feb 18 (Month is 0-indexed)

        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const params = settings.madhab === 'Jafri'
                ? CalculationMethod.Tehran()
                : CalculationMethod.Karachi(); // Regional default

            params.madhab = settings.madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;

            const times = new PrayerTimes(new Coordinates(coords.latitude, coords.longitude), date, params);

            // Apply safety buffers
            const sehri = new Date(times.fajr.getTime() - 60000);
            const iftar = new Date(times.maghrib.getTime() + 60000);

            days.push({
                ramzanDay: i + 1,
                date: date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }),
                dayName: date.toLocaleDateString('en-PK', { weekday: 'short' }),
                sehri: sehri.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                iftar: iftar.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            });
        }
        return days;
    }, [coords, settings]);

    if (!coords) return <p style={{ textAlign: 'center', opacity: 0.6 }}>Please select a location to view the calendar.</p>;

    return (
        <div className="calendar-container" style={{ maxHeight: '60vh', overflowY: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f5f5f5', zIndex: 1 }}>
                    <tr>
                        <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Day</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                        <th style={{ padding: '0.8rem', textAlign: 'center', borderBottom: '2px solid #ddd', color: '#b91c1c' }}>Sehri</th>
                        <th style={{ padding: '0.8rem', textAlign: 'center', borderBottom: '2px solid #ddd', color: '#15803d' }}>Iftar</th>
                    </tr>
                </thead>
                <tbody>
                    {calendarData.map((day) => (
                        <tr key={day.ramzanDay} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.8rem' }}>{day.ramzanDay}</td>
                            <td style={{ padding: '0.8rem' }}>
                                <div style={{ fontWeight: 600 }}>{day.date}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{day.dayName}</div>
                            </td>
                            <td style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 600 }}>{day.sehri}</td>
                            <td style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 600 }}>{day.iftar}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RamzanCalendar;
