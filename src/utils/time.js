export const formatTime = (date) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDuration = (duration) => {
    if (!duration) return "00 : 00 : 00";
    const { hours, minutes, seconds } = duration;
    const pad = (n) => n?.toString().padStart(2, '0') || '00';
    return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
};
