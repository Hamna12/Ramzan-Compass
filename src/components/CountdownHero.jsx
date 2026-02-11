import React from 'react';
import { MapPin, Moon } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';
import './CountdownHero.css';

const CountdownHero = ({ nextEvent, locationName, fiqh }) => {
    const timeLeft = useCountdown(nextEvent?.time);

    if (!nextEvent) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center', color: 'white' }}>
                <h2>Loading Prayer Times...</h2>
            </div>
        );
    }

    const isSehri = nextEvent.type === 'SEHRI';
    const eventLabel = isSehri ? 'SEHRI IN' : 'AFTARI IN';
    const nextTargetTime = nextEvent.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="hero-container">
            {/* Header Info */}
            <div className="hero-header">
                <h1 className="app-title">
                    Ramzan 1447
                </h1>
                <div className="info-row">
                    <div className="info-item">
                        <MapPin size={16} />
                        <span>{locationName || "Locating..."}</span>
                    </div>
                    <div className="info-item">
                        <Moon size={16} />
                        <span>Fiqh: {fiqh}</span>
                    </div>
                </div>
            </div>

            {/* Countdown Card */}
            <div className="glass-panel countdown-card">
                <h2 className="event-label">
                    {eventLabel}
                </h2>

                <div className="timer-display">
                    {timeLeft ? (
                        <>
                            {String(timeLeft.hours || 0).padStart(2, '0')}
                            <span className="timer-sep">:</span>
                            {String(timeLeft.minutes || 0).padStart(2, '0')}
                            <span className="timer-sep">:</span>
                            {String(timeLeft.seconds || 0).padStart(2, '0')}
                        </>
                    ) : (
                        "00 : 00 : 00"
                    )}
                </div>

                <div className="target-time">
                    Target: {nextTargetTime}
                </div>
            </div>
        </div>
    );
};

export default CountdownHero;
