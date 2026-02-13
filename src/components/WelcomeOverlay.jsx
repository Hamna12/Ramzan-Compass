import React from 'react';
import { Bell, Play } from 'lucide-react';
import './WelcomeOverlay.css';

const WelcomeOverlay = ({ onStart }) => {
    return (
        <div className="welcome-backdrop">
            <div className="welcome-card glass-panel">
                <div className="welcome-icon">
                    <Bell size={48} color="white" />
                </div>
                <h1 className="welcome-title">Ramzan Compass</h1>
                <p className="welcome-subtitle">
                    To ensure you never miss Iftari or Sehri, we need to enable automatic alerts and sound.
                </p>
                <button className="start-btn" onClick={onStart}>
                    <Play size={20} />
                    Enable Alerts & Start
                </button>
                <p className="welcome-footer">
                    This one-time setup allows automatic beeps and system notifications.
                </p>
            </div>
        </div>
    );
};

export default WelcomeOverlay;
