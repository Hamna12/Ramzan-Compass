import { useState, useEffect } from 'react';

export const useGeolocation = () => {
    const [location, setLocation] = useState({
        coords: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation({
                coords: null,
                error: "Geolocation is not supported by your browser.",
                loading: false,
            });
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes cache
        };

        const success = (position) => {
            console.log("Geolocation success:", position.coords.latitude, position.coords.longitude);
            setLocation({
                coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                },
                error: null,
                loading: false,
            });
        };

        const error = (err) => {
            console.warn(`Geolocation error (${err.code}): ${err.message}. Retrying with low accuracy...`);

            // Fallback to low accuracy if high accuracy fails
            if (options.enableHighAccuracy) {
                navigator.geolocation.getCurrentPosition(success, (secondErr) => {
                    console.error("Geolocation failed completely:", secondErr);
                    setLocation({
                        coords: null,
                        error: "Unable to retrieve your location. Please ensure location services are enabled.",
                        loading: false,
                    });
                }, { ...options, enableHighAccuracy: false, timeout: 10000 });
            } else {
                setLocation({
                    coords: null,
                    error: "Unable to retrieve your location.",
                    loading: false,
                });
            }
        };

        navigator.geolocation.getCurrentPosition(success, error, options);
    }, []);

    return location;
};
