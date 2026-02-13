import { useState, useEffect, useRef } from 'react';
import { Info, Search } from 'lucide-react';
import './App.css';
import BackgroundManager from './components/BackgroundManager';
import CountdownHero from './components/CountdownHero';
import InfoOverlay from './components/InfoOverlay';
import { useGeolocation } from './hooks/useGeolocation';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { searchCity, reverseGeocode } from './utils/geocoding';
import WelcomeOverlay from './components/WelcomeOverlay';

function App() {
  const { coords: geoCoords, error: geoError, loading: geoLoading } = useGeolocation();
  const [manualCoords, setManualCoords] = useState(null);
  const [manualLocationName, setManualLocationName] = useState(null);
  const [autoLocationName, setAutoLocationName] = useState(() => {
    const saved = localStorage.getItem('ramzan-auto-location');
    return saved ? JSON.parse(saved) : null;
  });

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
          const locationData = { name: res.name, countryCode: res.countryCode };
          setAutoLocationName(locationData);
          localStorage.setItem('ramzan-auto-location', JSON.stringify(locationData));
        } else {
          setAutoLocationName({ name: "Detected Location", countryCode: null });
        }
      }).catch(err => {
        console.error("Auto geocode failed:", err);
        setAutoLocationName({ name: "Detected Location", countryCode: null });
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
  const [testEvent, setTestEvent] = useState(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // Effective next event (test event takes precedence)
  const effectiveNextEvent = testEvent || nextEvent;

  const handleStartTest = () => {
    const target = new Date(Date.now() + 5000); // 5 seconds from now
    setTestEvent({ type: 'TEST', time: target });
    // Clear test event after 20 minutes to allow verification of the long pause
    setTimeout(() => setTestEvent(null), 1200000);
  };
  const [hasStarted, setHasStarted] = useState(() => {
    // We want to force the overlay on every page load to ensure fresh interaction
    return false;
  });

  const handleStartApp = async () => {
    // 1. Unlock Audio
    const audio = new Audio();
    audio.play().catch(() => { }); // Ignore initial silent play error

    // 2. Request Notification Permission
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        await Notification.requestPermission();
      }
    }

    setIsAudioUnlocked(true);
    setHasStarted(true);
  };

  // Audio Logic: Unlock audio context on first interaction
  useEffect(() => {
    const unlockAudio = () => {
      if (isAudioUnlocked) return;

      const audio = new Audio();
      audio.play().then(() => {
        setIsAudioUnlocked(true);
        console.log("Audio unlocked via interaction");
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      }).catch(e => {
        console.log("Audio unlock attempted, waiting for interaction:", e);
      });
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, [isAudioUnlocked]);

  // Audio Logic: Trigger beep exactly when countdown hits 0
  const lastPlayedRef = useRef(null);

  useEffect(() => {
    if (!effectiveNextEvent?.time) return;

    const checkSound = setInterval(() => {
      const now = new Date();
      const diff = effectiveNextEvent.time.getTime() - now.getTime();

      // If we are at 0 (or slightly past it due to internal delay)
      // And we haven't played for THIS specific event time yet
      if (diff <= 0 && diff > -2000 && lastPlayedRef.current !== effectiveNextEvent.time.getTime()) {
        lastPlayedRef.current = effectiveNextEvent.time.getTime();

        const audio = new Audio('https://www.islamcan.com/audio/adhan/azan21.mp3');
        const FALLBACK_URL = 'https://www.islamcan.com/audio/adhan/azan21.mp3';

        // Sound Trigger
        const playWithFallback = (player, isFallback = false) => {
          player.play().then(() => {
            if (!isAudioUnlocked) setIsAudioUnlocked(true);
          }).catch(e => {
            console.warn(isFallback ? "Auto Fallback failed:" : "Auto Local failed:", e);
            if (!isFallback) {
              new Audio(FALLBACK_URL).play().then(() => {
                if (!isAudioUnlocked) setIsAudioUnlocked(true);
              }).catch(err => console.error("Final auto failure:", err));
            }
          });
        };

        playWithFallback(audio);

        // System Notification Trigger
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`${effectiveNextEvent.type} Time!`, {
            body: `It's time for ${effectiveNextEvent.type === 'TEST' ? 'Testing' : (effectiveNextEvent.type === 'SEHRI' ? 'Sehri' : 'Iftari')}.`,
            icon: '/favicon.svg',
            silent: false
          });
        }

        console.log(`Auto-Alert triggered for ${effectiveNextEvent.type} at ${effectiveNextEvent.time.toLocaleTimeString()}`);
      }
    }, 500); // Check every 500ms for tighter response

    return () => clearInterval(checkSound);
  }, [effectiveNextEvent, isAudioUnlocked]);


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
      setShowSearch(false); // hide on success
    } else {
      setSearchError("City not found. Try another.");
    }
  };

  const locationName = manualLocationName || autoLocationName?.name ||
    (geoCoords ? "Detecting City..." : (geoLoading ? "Locating..." : "Location Unknown"));

  // Show logic: 
  // 1. If we have activeCoords (either geo or manual), show Hero.
  // 2. If NO activeCoords AND geoError, show Error/Manual Input Panel.
  const showHero = !!activeCoords;

  return (
    <>
      {!hasStarted && <WelcomeOverlay onStart={handleStartApp} />}
      <BackgroundManager nextEventType={nextEvent?.type} />

      <main className="main-container">
        {/* Top Controls */}
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          gap: '0.8rem',
          zIndex: 10
        }}>
          {showHero && (
            <button
              onClick={() => setShowSearch(!showSearch)}
              style={{
                background: showSearch ? 'white' : 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showSearch ? 'black' : 'white',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.3s ease'
              }}
              aria-label="Search City"
            >
              <Search size={20} />
            </button>
          )}

          {showHero && (
            <button
              onClick={() => setIsOverlayOpen(true)}
              style={{
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
                backdropFilter: 'blur(4px)'
              }}
              aria-label="Show Prayer Times"
            >
              <Info size={20} />
            </button>
          )}
        </div>

        {/* Search Overlay / Panel */}
        {showSearch && (
          <div className="glass-panel" style={{
            position: 'fixed',
            top: '5.5rem',
            right: '1.5rem',
            padding: '1.5rem',
            width: '300px',
            zIndex: 100,
            animation: 'slideDown 0.3s ease'
          }}>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '0.9rem' }}>Set Location Manually</h4>
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter city (e.g. Lahore)"
                value={searchQuery}
                onFocus={() => { if (testEvent) setTestEvent(null) }}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              />
              {searchError && <span style={{ color: '#ff6b6b', fontSize: '0.75rem' }}>{searchError}</span>}
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  background: 'white',
                  color: 'black',
                  border: 'none',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}
              >
                {isSearching ? "Searching..." : "Update Location"}
              </button>
            </form>
          </div>
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
            nextEvent={effectiveNextEvent}
            locationName={locationName}
            fiqh={settings.madhab}
            isAudioUnlocked={isAudioUnlocked}
          />
        )}

        <InfoOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          prayerTimes={prayerTimes}
          nextEvent={effectiveNextEvent}
          settings={settings}
          onSettingsChange={setSettings}
          activeCoords={activeCoords}
          isAudioUnlocked={isAudioUnlocked}
          setIsAudioUnlocked={setIsAudioUnlocked}
          onTestAlert={handleStartTest}
        />
      </main>
    </>
  );
}

export default App;
