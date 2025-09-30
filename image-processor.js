// Advanced image processing utilities
class ImageProcessor {
    static async processImage(image, options = {}) {
        const {
            maxWidth = 1200,
            maxHeight = 800,
            quality = 'high',
            format = 'rgba'
        } = options;

        // Create working canvas
        const canvas = CanvasUtils.createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        // Resize if needed
        let processedCanvas = canvas;
        if (image.width > maxWidth || image.height > maxHeight) {
            processedCanvas = CanvasUtils.resizeCanvas(canvas, maxWidth, maxHeight);
        }

        // Apply quality settings
        if (quality === 'medium') {
            processedCanvas = this.applyQualityReduction(processedCanvas, 0.7);
        } else if (quality === 'low') {
            processedCanvas = this.applyQualityReduction(processedCanvas, 0.5);
        }

        return processedCanvas;
    }

    static applyQualityReduction(canvas, factor) {
        const tempCanvas = CanvasUtils.createCanvas(
            Math.max(1, canvas.width * factor),
            Math.max(1, canvas.height * factor)
        );
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Scale back up with smoothing
        const finalCanvas = CanvasUtils.createCanvas(canvas.width, canvas.height);
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        finalCtx.drawImage(tempCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
        
        return finalCanvas;
    }

    static toGrayscale(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = data[i + 1] = data[i + 2] = gray;
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    static adjustContrast(canvas, contrast) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = this.clamp(factor * (data[i] - 128) + 128);
            data[i + 1] = this.clamp(factor * (data[i + 1] - 128) + 128);
            data[i + 2] = this.clamp(factor * (data[i + 2] - 128) + 128);
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    static adjustBrightness(canvas, brightness) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = this.clamp(data[i] + brightness);
            data[i + 1] = this.clamp(data[i + 1] + brightness);
            data[i + 2] = this.clamp(data[i + 2] + brightness);
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    static applyGaussianBlur(canvas, radius) {
        if (radius === 0) return canvas;
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const blurredData = this.gaussianBlur(imageData, radius);
        ctx.putImageData(blurredData, 0, 0);
        
        return canvas;
    }

    static gaussianBlur(imageData, radius) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Create kernel
        const kernel = this.createGaussianKernel(radius);
        const half = Math.floor(kernel.length / 2);
        
        // Temporary buffer
        const tempData = new Uint8ClampedArray(data.length);
        
        // Horizontal pass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                let weight = 0;
                
                for (let kx = -half; kx <= half; kx++) {
                    const px = this.clampPixel(x + kx, width);
                    const idx = (y * width + px) * 4;
                    const kernelVal = kernel[kx + half];
                    
                    r += data[idx] * kernelVal;
                    g += data[idx + 1] * kernelVal;
                    b += data[idx + 2] * kernelVal;
                    a += data[idx + 3] * kernelVal;
                    weight += kernelVal;
                }
                
                const idx = (y * width + x) * 4;
                tempData[idx] = r / weight;
                tempData[idx + 1] = g / weight;
                tempData[idx + 2] = b / weight;
                tempData[idx + 3] = a / weight;
            }
        }
        
        // Vertical pass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                let weight = 0;
                
                for (let ky = -half; ky <= half; ky++) {
                    const py = this.clampPixel(y + ky, height);
                    const idx = (py * width + x) * 4;
                    const kernelVal = kernel[ky + half];
                    
                    r += tempData[idx] * kernelVal;
                    g += tempData[idx + 1] * kernelVal;
                    b += tempData[idx + 2] * kernelVal;
                    a += tempData[idx + 3] * kernelVal;
                    weight += kernelVal;
                }
                
                const idx = (y * width + x) * 4;
                data[idx] = r / weight;
                data[idx + 1] = g / weight;
                data[idx + 2] = b / weight;
                data[idx + 3] = a / weight;
            }
        }
        
        return imageData;
    }

    static createGaussianKernel(radius) {
        const size = radius * 2 + 1;
        const kernel = new Array(size);
        const sigma = radius / 3;
        let sum = 0;
        
        for (let i = 0; i < size; i++) {
            const x = i - radius;
            kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
            sum += kernel[i];
        }
        
        // Normalize
        for (let i = 0; i < size; i++) {
            kernel[i] /= sum;
        }
        
        return kernel;
    }

    static extractColors(canvas, maxColors = 16) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const colorMap = new Map();
        
        // Sample colors (every 4th pixel for performance)
        for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const key = `${r},${g},${b}`;
            
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        // Sort by frequency and take top colors
        return Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxColors)
            .map(([key]) => {
                const [r, g, b] = key.split(',').map(Number);
                return { r, g, b, hex: this.rgbToHex(r, g, b) };
            });
    }

    static rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    static clamp(value, min = 0, max = 255) {
        return Math.min(Math.max(value, min), max);
    }

    static clampPixel(value, max) {
        return Math.min(Math.max(value, 0), max - 1);
    }
}

// Edge detection algorithms
class EdgeDetector {
    static sobel(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        
        const output = new Uint8ClampedArray(data.length);
        
        // Sobel kernels
        const kernelX = [
            -1, 0, 1,
            -2, 0, 2,
            -1, 0, 1
        ];
        
        const kernelY = [
            -1, -2, -1,
             0,  0,  0,
             1,  2,  1
        ];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                
                // Convolve with Sobel kernels
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
                        const kernelIndex = (ky + 1) * 3 + (kx + 1);
                        
                        gx += gray * kernelX[kernelIndex];
                        gy += gray * kernelY[kernelIndex];
                    }
                }
                
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const idx = (y * width + x) * 4;
                const value = Math.min(255, magnitude);
                
                output[idx] = value;
                output[idx + 1] = value;
                output[idx + 2] = value;
                output[idx + 3] = 255;
            }
        }
        
        return new ImageData(output, width, height);
    }
    
    static canny(canvas, lowThreshold = 50, highThreshold = 100) {
        // Simplified Canny edge detection
        const grayscale = ImageProcessor.toGrayscale(canvas);
        const smoothed = ImageProcessor.applyGaussianBlur(grayscale, 1);
        const edges = this.sobel(smoothed);
        
        // Non-maximum suppression and hysteresis thresholding would go here
        // This is a simplified version
        
        return edges;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageProcessor, EdgeDetector };
}
