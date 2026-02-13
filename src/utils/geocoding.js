export const searchCity = async (cityName) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(cityName)}`, {
            headers: { 'User-Agent': 'RamzanTool/1.0 (contact@example.com)' }
        });
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
        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
};

export const reverseGeocode = async (lat, lon) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: { 'User-Agent': 'RamzanTool/1.0 (contact@example.com)' }
        });
        const data = await response.json();
        const addr = data.address;
        // Robust city name detection prioritizing granularity
        const granularName = addr.city || addr.town || addr.village || addr.suburb ||
            addr.neighbourhood || addr.hamlet || addr.city_district ||
            addr.county || addr.state_district;

        // Last resort: Clean up display_name (e.g., "Lahore, Punjab, Pakistan") to just "Lahore"
        const fallbackFromDisplay = data.display_name ? data.display_name.split(',')[0] : "Detected Location";

        const cityName = (granularName && !granularName.includes("Division"))
            ? granularName
            : fallbackFromDisplay;

        return {
            name: cityName,
            countryCode: addr.country_code?.toUpperCase()
        };
        return null;
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return null;
    }
};
