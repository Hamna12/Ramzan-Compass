export const searchCity = async (cityName) => {
    // Try Primary API (Nominatim)
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(cityName)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            const addr = data[0].address;
            return {
                name: addr?.city || addr?.town || addr?.village || addr?.suburb || addr?.city_district || data[0].display_name.split(',')[0],
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                countryCode: addr?.country_code?.toUpperCase()
            };
        }
    } catch (error) {
        console.error("Primary geocoding error:", error);
    }

    // Fallback API (Geocode.maps.co - more permissive)
    try {
        const response = await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(cityName)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                name: data[0].display_name.split(',')[0],
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                countryCode: null // Geocode.maps.co search doesn't return country code directly in first level
            };
        }
    } catch (error) {
        console.error("Fallback geocoding error:", error);
    }

    return null;
};

export const reverseGeocode = async (lat, lon) => {
    // Try Primary API
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        if (data && data.address) {
            const addr = data.address;
            const granularName = addr.city || addr.town || addr.village || addr.suburb ||
                addr.neighbourhood || addr.hamlet || addr.city_district ||
                addr.county || addr.state_district;

            const fallbackFromDisplay = data.display_name ? data.display_name.split(',')[0] : "Detected Location";
            const cityName = (granularName && !granularName.includes("Division")) ? granularName : fallbackFromDisplay;

            return {
                name: cityName,
                countryCode: addr.country_code?.toUpperCase()
            };
        }
    } catch (error) {
        console.error("Primary reverse geocoding error:", error);
    }

    // Fallback API
    try {
        const response = await fetch(`https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}`);
        const data = await response.json();
        if (data && data.address) {
            const addr = data.address;
            const cityName = addr.city || addr.town || addr.village || addr.suburb || data.display_name?.split(',')[0];
            return {
                name: cityName,
                countryCode: addr.country_code?.toUpperCase()
            };
        }
    } catch (error) {
        console.error("Fallback reverse geocoding error:", error);
    }

    return null;
};
