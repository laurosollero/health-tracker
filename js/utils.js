// Utility Functions for Mounjaro Tracker
// Common helper functions and utilities

class Utils {
    // Show message to user
    static showMessage(text, type = 'success', targetId = 'dailyMessages') {
        const messagesDiv = document.getElementById(targetId);
        if (!messagesDiv) {
            console.warn(`Message target '${targetId}' not found`);
            return;
        }
        
        messagesDiv.innerHTML = `<div class="message ${type}">${text}</div>`;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            messagesDiv.innerHTML = '';
        }, 5000);
    }

    // Clear messages from a target element
    static clearMessages(targetId) {
        const messagesDiv = document.getElementById(targetId);
        if (messagesDiv) {
            messagesDiv.innerHTML = '';
        }
    }

    // Handle application errors
    static handleError(error, context = 'Application') {
        console.error(`${context} error:`, error);
        
        // Show user-friendly error message
        let userMessage = 'An unexpected error occurred.';
        
        if (error.message) {
            userMessage = error.message;
        }
        
        this.showMessage(`Error: ${userMessage}`, 'error');
    }

    // Format date for display
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        };
        
        return new Date(date).toLocaleDateString('en-US', defaultOptions);
    }

    // Format date and time for display
    static formatDateTime(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            ...options
        };
        
        return new Date(date).toLocaleString('en-US', defaultOptions);
    }

    // Calculate days between two dates
    static daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    }

    // Debounce function for performance optimization
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Throttle function for performance optimization
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate weight input
    static isValidWeight(weight) {
        const weightNum = parseFloat(weight);
        return !isNaN(weightNum) && weightNum > 0 && weightNum < 1000;
    }

    // Validate date input
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // Format file size for display
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Check if device is mobile
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Check if device supports touch
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Get current timestamp in ISO format
    static getCurrentTimestamp() {
        return new Date().toISOString();
    }

    // Convert weight between units (kg/lbs)
    static convertWeight(weight, fromUnit, toUnit) {
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum)) return null;
        
        if (fromUnit === toUnit) return weightNum;
        
        if (fromUnit === 'kg' && toUnit === 'lbs') {
            return Math.round(weightNum * 2.20462 * 10) / 10;
        }
        
        if (fromUnit === 'lbs' && toUnit === 'kg') {
            return Math.round(weightNum / 2.20462 * 10) / 10;
        }
        
        return weightNum;
    }

    // Sanitize HTML to prevent XSS
    static sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    // Download data as file
    static downloadFile(data, filename, mimeType = 'application/octet-stream') {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // Parse query parameters from URL
    static getQueryParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const queries = queryString.split('&');
        
        queries.forEach(query => {
            const [key, value] = query.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return params;
    }

    // Update URL query parameters
    static updateQueryParams(params) {
        const url = new URL(window.location);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value);
            }
        });
        
        window.history.replaceState({}, '', url);
    }

    // Local storage helper functions
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Error clearing localStorage:', error);
                return false;
            }
        }
    };

    // Animation helpers
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress.toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    static fadeOut(element, duration = 300) {
        const start = performance.now();
        const initialOpacity = parseFloat(element.style.opacity) || 1;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = (initialOpacity * (1 - progress)).toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Color manipulation helpers
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Performance monitoring
    static performance = {
        mark(name) {
            if (window.performance && window.performance.mark) {
                window.performance.mark(name);
            }
        },
        
        measure(name, startMark, endMark) {
            if (window.performance && window.performance.measure) {
                window.performance.measure(name, startMark, endMark);
            }
        },
        
        getEntriesByType(type) {
            if (window.performance && window.performance.getEntriesByType) {
                return window.performance.getEntriesByType(type);
            }
            return [];
        }
    };

    // Accessibility helpers
    static announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        
        document.body.appendChild(announcement);
        announcement.textContent = message;
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Feature detection
    static supports = {
        localStorage: (() => {
            try {
                const test = 'test';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        })(),
        
        serviceWorker: 'serviceWorker' in navigator,
        
        pushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
        
        webShare: 'share' in navigator,
        
        fileAPI: 'File' in window && 'FileReader' in window,
        
        canvas: (() => {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        })(),
    };
}