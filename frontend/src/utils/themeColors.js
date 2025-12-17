export const COLOR_MAPPING = {
    '#121212': { dark: '#121212', light: '#ffffff' },        // Default
    '#5c2b29': { dark: '#5c2b29', light: '#f28b82' },        // Red
    '#614a19': { dark: '#614a19', light: '#fbbc04' },        // Orange
    '#635d19': { dark: '#635d19', light: '#fff475' },        // Yellow
    '#345920': { dark: '#345920', light: '#ccff90' },        // Green
    '#16504b': { dark: '#16504b', light: '#a7ffeb' },        // Teal
    '#2d555e': { dark: '#2d555e', light: '#cbf0f8' },        // Cyan
    '#1e3a5f': { dark: '#1e3a5f', light: '#aecbfa' },        // Blue
    '#42275e': { dark: '#42275e', light: '#d7aefb' },        // Purple
    '#5b2245': { dark: '#5b2245', light: '#fdcfe8' },        // Pink
    '#442726': { dark: '#442726', light: '#e6c9a8' },        // Brown
    '#3c3f43': { dark: '#3c3f43', light: '#e8eaed' },        // Grey
    '#ffffff': { dark: '#121212', light: '#ffffff' }         // Handle legacy white
};

export const getColorForTheme = (storedColor, theme) => {
    // If color is not in mapping, fallback to storedColor (custom colors?)
    // Or if undefined, default to theme default
    const map = COLOR_MAPPING[storedColor];
    if (!map) return storedColor;
    return theme === 'light' ? map.light : map.dark;
};

export const getTextColorForTheme = (storedColor, theme) => {
    // If Light Mode + NOT Default White -> Dark Text
    // If Dark Mode -> White Text
    if (theme === 'light') {
        // Almost all pastels need dark text
        return '#202124';
    }
    return '#e0e0e0'; // Dark mode text
};
