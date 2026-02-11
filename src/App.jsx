import { useState, useEffect } from 'react';
import { Info, Search } from 'lucide-react';
import './App.css';
import BackgroundManager from './components/BackgroundManager';
import CountdownHero from './components/CountdownHero';
import InfoOverlay from './components/InfoOverlay';
import { useGeolocation } from './hooks/useGeolocation';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { searchCity, reverseGeocode } from './utils/geocoding';

function App() {
  const { coords: geoCoords, error: geoError, loading: geoLoading } = useGeolocation();
  const [manualCoords, setManualCoords] = useState(null);
  const [manualLocationName, setManualLocationName] = useState(null);
  const [autoLocationName, setAutoLocationName] = useState(null);

  // Use manual coords if available, otherwise fallback to geoCoords
  const activeCoords = manualCoords ? {
    ...manualCoords,
    countryCode: manualCoords.countryCode
  } : geoCoords ? {
    latitude: geoCoords.latitude,
    longitude: geoCoords.longitude,
    countryCode: autoLocationName?.countryCode
  } : null;

  useEffect(() => {
    if (geoCoords && !manualCoords) {
      reverseGeocode(geoCoords.latitude, geoCoords.longitude).then(res => {
        if (res) {
          setAutoLocationName({ name: res.name, countryCode: res.countryCode });
        }
      });
    }
  }, [geoCoords, manualCoords]);

  // Settings State (Persisted)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ramzan-settings');
    const parsed = saved ? JSON.parse(saved) : { madhab: 'Hanafi', countdownMode: 'auto' };
    return {
      madhab: parsed.madhab || 'Hanafi',
      countdownMode: parsed.countdownMode || 'auto'
    };
  });

  useEffect(() => {
    localStorage.setItem('ramzan-settings', JSON.stringify(settings));
  }, [settings]);

  const { prayerTimes, nextEvent } = usePrayerTimes(activeCoords, settings);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Audio Logic
  useEffect(() => {
    // Check if we hit 0 on countdown? 
    // Actually, usePrayerTimes NextEvent changes when time passes. 
    // We can detect if nextEvent changes AND it's exactly the time.
    // Simpler: Check every second in a separate interval or rely on Countdown hook callback if we added one.

    // Let's implement a simple check: IF current time matches nextEvent time EXACTLY, play sound.
    // Better: useCountdown is already ticking. 
    // Ideally, we start playing sound when timeLeft becomes 0.
    // But useCountdown just returns timeLeft.

    // Let's rely on a check here.
    const checkSound = setInterval(() => {
      if (!nextEvent?.time) return;
      const now = new Date();
      const diff = nextEvent.time.getTime() - now.getTime();

      // If within 1 second of target (and positive)
      if (diff > 0 && diff < 1000) {
        const audio = new Audio('/notification.mp3');
        const FALLBACK_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

        const playWithFallback = (player, isFallback = false) => {
          player.play().catch(e => {
            console.warn(isFallback ? "Auto Fallback failed:" : "Auto Local failed:", e);
            if (!isFallback) {
              new Audio(FALLBACK_URL).play().catch(err => console.error("Final auto failure:", err));
            }
          });
        };

        playWithFallback(audio);
      }
    }, 1000);

    return () => clearInterval(checkSound);
  }, [nextEvent]);


  // Manual search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    const result = await searchCity(searchQuery);
    setIsSearching(false);

    if (result) {
      setManualCoords({
        latitude: result.latitude,
        longitude: result.longitude,
        countryCode: result.countryCode
      });
      setManualLocationName(result.name);
      setSearchQuery(''); // clear
    } else {
      setSearchError("City not found. Try another.");
    }
  };

  const locationName = manualLocationName || autoLocationName?.name ||
    (geoCoords ? "Detecting City..." : "Locating...");

  // Show logic: 
  // 1. If we have activeCoords (either geo or manual), show Hero.
  // 2. If NO activeCoords AND geoError, show Error/Manual Input Panel.
  const showHero = !!activeCoords;

  return (
    <>
      <BackgroundManager nextEventType={nextEvent?.type} />

      <main className="main-container">
        {/* Top Right info button - Only show if we have data */}
        {showHero && (
          <button
            onClick={() => setIsOverlayOpen(true)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              zIndex: 10
            }}
            aria-label="Show Prayer Times"
          >
            <Info size={20} />
          </button>
        )}

        {!showHero && (
          <div className="glass-panel error-panel" style={{ padding: '2rem', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Location Required</h3>
            <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
              {geoLoading ? "🔍 Detecting your location automatically..." : (geoError || "We need your location to calculate prayer times.")}
            </p>

            {!geoLoading && (
              <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Or enter your city (e.g. Lahore)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                {searchError && <span style={{ color: '#ff6b6b', fontSize: '0.8rem', textAlign: 'left' }}>{searchError}</span>}

                <button
                  type="submit"
                  disabled={isSearching}
                  style={{
                    marginTop: '0.5rem',
                    background: 'white',
                    color: 'black',
                    border: 'none',
                    fontWeight: '600'
                  }}
                >
                  {isSearching ? "Searching..." : "Set Location"}
                </button>
              </form>
            )}

            {!geoLoading && (
              <div style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                <button
                  onClick={() => window.location.reload()}
                  style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                >
                  Retry Auto-Detect
                </button>
              </div>
            )}
          </div>
        )}

        {showHero && (
          <CountdownHero
            nextEvent={nextEvent}
            locationName={locationName}
            fiqh={settings.madhab}
          />
        )}

        <InfoOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          prayerTimes={prayerTimes}
          nextEvent={nextEvent}
          settings={settings}
          onSettingsChange={setSettings}
          activeCoords={activeCoords}
        />
      </main>
    </>
  );
}

export default App;
