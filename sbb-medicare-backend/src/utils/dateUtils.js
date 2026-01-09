/**
 * Date utilities for IST (Indian Standard Time)
 * IST is UTC+5:30
 */

/**
 * Get current date/time in IST
 * @returns {Date} Current date in IST
 */
function getCurrentISTDate() {
    const now = new Date();
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    return new Date(utcTime + istOffset);
}

/**
 * Get current date string in IST (YYYY-MM-DD)
 * @returns {string} Current date in IST format
 */
function getCurrentISTDateString() {
    const istDate = getCurrentISTDate();
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get current timestamp in IST (ISO format)
 * @returns {string} Current timestamp in IST ISO format
 */
function getCurrentISTTimestamp() {
    const istDate = getCurrentISTDate();
    return istDate.toISOString();
}

/**
 * Convert UTC date to IST
 * @param {Date|string} date - Date to convert
 * @returns {Date} Date in IST
 */
function toIST(date) {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60 * 1000);
    return new Date(utcTime + istOffset);
}

/**
 * Format date to IST string (YYYY-MM-DD HH:mm:ss)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string in IST
 */
function formatIST(date) {
    if (!date) return null;
    const istDate = toIST(date);
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    const seconds = String(istDate.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get IST date string for a date (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} Date string in IST
 */
function getISTDateString(date) {
    if (!date) return null;
    const istDate = toIST(date);
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

module.exports = {
    getCurrentISTDate,
    getCurrentISTDateString,
    getCurrentISTTimestamp,
    toIST,
    formatIST,
    getISTDateString
};

