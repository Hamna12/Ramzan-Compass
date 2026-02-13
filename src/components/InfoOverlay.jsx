import { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import RamzanCalendar from './RamzanCalendar';
import './InfoOverlay.css';

const InfoOverlay = ({ isOpen, onClose, prayerTimes, settings, onSettingsChange, activeCoords, isAudioUnlocked, setIsAudioUnlocked, onTestAlert }) => {
    const [draftSettings, setDraftSettings] = useState(settings);
    const [activeTab, setActiveTab] = useState('times'); // 'times' or 'calendar'

    // Calculate preview times based on draft settings
    const { prayerTimes: previewTimes } = usePrayerTimes(activeCoords, draftSettings);

    // Sync draft with global when opening
    useEffect(() => {
        if (isOpen) setDraftSettings(settings);
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSettingsChange(draftSettings);
        onClose();
    };

    // Helper to format
    const format = (date) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

    // Use previewTimes for the display schedule
    const schedule = [
        { name: 'Sehri Ends (Fajr)', time: previewTimes?.fajr || prayerTimes?.fajr },
        { name: 'Sunrise', time: previewTimes?.sunrise || prayerTimes?.sunrise },
        { name: 'Dhuhr', time: previewTimes?.dhuhr || prayerTimes?.dhuhr },
        { name: 'Asr', time: previewTimes?.asr || prayerTimes?.asr },
        { name: 'Iftar (Maghrib)', time: previewTimes?.maghrib || prayerTimes?.maghrib },
        { name: 'Isha', time: previewTimes?.isha || prayerTimes?.isha },
    ];

    return (
        <div className="overlay-backdrop" onClick={onClose}>
            <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
                <div className="overlay-header">
                    <h3 className="overlay-title">Settings & Taqweem</h3>
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="tab-switcher" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
                    <button
                        onClick={() => setActiveTab('times')}
                        style={{
                            padding: '0.8rem',
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'times' ? '2px solid #2563eb' : '2px solid transparent',
                            color: activeTab === 'times' ? '#2563eb' : '#666',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer'
                        }}
                    >
                        <Clock size={16} /> Today
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        style={{
                            padding: '0.8rem',
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'calendar' ? '2px solid #2563eb' : '2px solid transparent',
                            color: activeTab === 'calendar' ? '#2563eb' : '#666',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer'
                        }}
                    >
                        <Calendar size={16} /> 30-Day
                    </button>
                </div>

                {activeTab === 'times' ? (
                    <>
                        {/* Settings Section */}
                        <div className="settings-section" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
                            <div style={{ marginBottom: '1.2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.6rem', fontWeight: 600 }}>Fiqh (Calculation Rule)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className={`setting-btn ${draftSettings.madhab === 'Hanafi' ? 'active' : ''}`}
                                        onClick={() => setDraftSettings({ ...draftSettings, madhab: 'Hanafi' })}
                                    >
                                        Hanafi
                                    </button>
                                    <button
                                        className={`setting-btn ${draftSettings.madhab === 'Jafri' ? 'active' : ''}`}
                                        onClick={() => setDraftSettings({ ...draftSettings, madhab: 'Jafri' })}
                                    >
                                        Jafri
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.6rem', fontWeight: 600 }}>Countdown Tracking</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className={`setting-btn ${draftSettings.countdownMode === 'auto' ? 'active' : ''}`}
                                            style={{ fontSize: '0.85rem' }}
                                            onClick={() => setDraftSettings({ ...draftSettings, countdownMode: 'auto' })}
                                        >
                                            Automatic
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className={`setting-btn ${draftSettings.countdownMode === 'aftari' ? 'active' : ''}`}
                                            style={{ fontSize: '0.85rem' }}
                                            onClick={() => setDraftSettings({ ...draftSettings, countdownMode: 'aftari' })}
                                        >
                                            Next Aftari
                                        </button>
                                        <button
                                            className={`setting-btn ${draftSettings.countdownMode === 'sehri' ? 'active' : ''}`}
                                            style={{ fontSize: '0.85rem' }}
                                            onClick={() => setDraftSettings({ ...draftSettings, countdownMode: 'sehri' })}
                                        >
                                            Next Sehri
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.6rem', fontWeight: 600 }}>Alert Notification</label>
                                <button
                                    className="setting-btn"
                                    style={{
                                        width: '100%',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                    onClick={() => {
                                        const btn = document.getElementById('test-audio-btn');
                                        if (btn) btn.innerText = "🔊 Playing...";

                                        const audio = new Audio('https://www.islamcan.com/audio/adhan/azan21.mp3');
                                        const FALLBACK_URL = 'https://www.islamcan.com/audio/adhan/azan21.mp3';

                                        const tryPlay = (player, isFallback = false) => {
                                            player.play().then(() => {
                                                if (setIsAudioUnlocked) setIsAudioUnlocked(true);
                                                player.onended = () => {
                                                    if (btn) btn.innerText = "🎵 Test Alert Sound";
                                                };
                                            }).catch(e => {
                                                console.warn(isFallback ? "Fallback failed:" : "Local failed:", e);
                                                if (!isFallback) {
                                                    const fallback = new Audio(FALLBACK_URL);
                                                    tryPlay(fallback, true);
                                                } else {
                                                    if (btn) btn.innerText = "❌ Error Playing";
                                                    setTimeout(() => { if (btn) btn.innerText = "🎵 Test Alert Sound"; }, 2000);
                                                }
                                            });
                                        };

                                        tryPlay(audio);
                                    }}
                                    id="test-audio-btn"
                                >
                                    🎵 Test Alert Sound
                                </button>
                                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.4rem' }}>
                                    (Click to hear the sound played at Sehri/Iftar)
                                </p>

                                <button
                                    className="setting-btn"
                                    style={{
                                        width: '100%',
                                        marginTop: '0.8rem',
                                        fontSize: '0.9rem',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        color: '#64748b',
                                        fontWeight: 600
                                    }}
                                    onClick={() => {
                                        onTestAlert();
                                        onClose();
                                    }}
                                >
                                    🕒 Test 5-Sec Countdown
                                </button>
                                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.4rem' }}>
                                    (Simulates a real 0:00:00 end with sound & notification)
                                </p>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic', marginBottom: '1.2rem' }}>
                                * Precautionary buffer (1-min) applied for safety.
                            </div>

                            <button className="save-btn" onClick={handleSave} style={{ marginTop: '0.5rem' }}>
                                Save Changes
                            </button>
                        </div>

                        <h4 style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.8, fontWeight: 700 }}>Prayer Schedule</h4>
                        <div className="times-list">
                            {schedule.map((item, idx) => (
                                <div key={idx} className="time-row">
                                    <span className="time-name">{item.name}</span>
                                    <span className="time-value">{format(item.time)}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <RamzanCalendar coords={activeCoords} settings={draftSettings} />
                )}
            </div>
        </div>
    );
};

export default InfoOverlay;
