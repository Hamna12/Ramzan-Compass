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

        const success = (position) => {
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
            setLocation({
                coords: null,
                error: "Unable to retrieve your location. Please ensure location services are enabled.",
                loading: false,
            });
        };

        navigator.geolocation.getCurrentPosition(success, error, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    }, []);

    return location;
};
