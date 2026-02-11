import React from 'react';

const BackgroundManager = ({ nextEventType }) => {
    const getGradient = () => {
        switch (nextEventType) {
            case 'AFTARI':
                return 'var(--bg-aftari)';
            case 'SEHRI':
                return 'var(--bg-sehri)';
            default:
                return 'var(--bg-day)';
        }
    };

    const isAftari = nextEventType === 'AFTARI';
    const isSehri = nextEventType === 'SEHRI';

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: getGradient(),
            transition: 'background 2s ease-in-out',
            zIndex: -1,
            overflow: 'hidden'
        }}>
            <div className="pattern-overlay" />

            {/* Drifting Clouds for Day/Aftari */}
            {!isSehri && (
                <div className="clouds" style={{
                    position: 'absolute',
                    top: '10%',
                    left: 0,
                    width: '300%',
                    height: '20%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%)',
                    backgroundSize: '400px 100px',
                    opacity: 0.4,
                    animation: 'drift 60s linear infinite'
                }} />
            )}

            {/* Glowing Moon and Stars for Sehri */}
            {isSehri && (
                <>
                    <div className="moon" style={{
                        position: 'absolute',
                        top: '10%',
                        right: '15%',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        boxShadow: 'inset 20px 0 0 0 #fff',
                        filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.4))',
                        opacity: 0.9,
                        animation: 'palse 4s ease-in-out infinite'
                    }} />
                    <div className="stars" style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 1px, transparent 2px)',
                        backgroundSize: '100px 100px',
                        opacity: 0.3
                    }} />
                </>
            )}

            {/* Subtle Mosque Silhouette for Aftari */}
            {isAftari && (
                <div className="mosque-silhouette" style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    height: '150px',
                    opacity: 0.15,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 300'%3E%3Cpath d='M0 300h1000V200s-50-20-100 0v-50s-30-50-100-50-100 50-100 50V50s-40-50-100-50-100 50-100 50v150s-50-50-150-50-150 50-150 50V100s-50-50-100-50S0 100 0 100v200z' fill='%23000'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat-x',
                    backgroundPosition: 'bottom center',
                    backgroundSize: '800px 150px'
                }} />
            )}

            <style>{`
                @keyframes drift {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                @keyframes palse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default BackgroundManager;
