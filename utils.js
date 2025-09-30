// Utility functions and helpers
class VectorUtils {
    static generateId() {
        return 'vector_' + Math.random().toString(36).substr(2, 9);
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static formatTime(seconds) {
        if (seconds < 1) return (seconds * 1000).toFixed(0) + 'ms';
        return seconds.toFixed(2) + 's';
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

class FileUtils {
    static async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    static validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!validTypes.includes(file.type)) {
            throw new Error('Please upload a valid image file (JPG, PNG, WEBP, GIF)');
        }
        
        if (file.size > maxSize) {
            throw new Error('File size must be less than 10MB');
        }
        
        return true;
    }

    static downloadSVG(svgString, filename = 'vector-image.svg') {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        this.downloadBlob(blob, filename);
    }

    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }
}

class UIEffects {
    static showLoading(element, message = 'Processing...') {
        element.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner-small"></div>
                <span>${message}</span>
            </div>
        `;
    }

    static showError(element, message) {
        element.innerHTML = `
            <div class="error-state">
                <span class="error-icon">❌</span>
                <span>${message}</span>
            </div>
        `;
    }

    static showSuccess(element, message) {
        element.innerHTML = `
            <div class="success-state">
                <span class="success-icon">✅</span>
                <span>${message}</span>
            </div>
        `;
    }

    static createNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        return notification;
    }
}

class CanvasUtils {
    static createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    static resizeCanvas(canvas, maxWidth, maxHeight) {
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        
        let newWidth = width;
        let newHeight = height;
        
        if (width > maxWidth) {
            newHeight = (height * maxWidth) / width;
            newWidth = maxWidth;
        }
        
        if (newHeight > maxHeight) {
            newWidth = (newWidth * maxHeight) / newHeight;
            newHeight = maxHeight;
        }
        
        const resizedCanvas = this.createCanvas(newWidth, newHeight);
        const resizedCtx = resizedCanvas.getContext('2d');
        
        resizedCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
        return resizedCanvas;
    }

    static canvasToBlob(canvas, quality = 0.92) {
        return new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', quality);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VectorUtils, FileUtils, UIEffects, CanvasUtils };
}
