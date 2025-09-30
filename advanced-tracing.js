// Advanced vector tracing algorithms
class AdvancedTracer {
    static traceImage(canvas, options = {}) {
        const {
            algorithm = 'auto',
            threshold = 128,
            smoothness = 5,
            noiseReduction = 3,
            cornerThreshold = 0.8,
            enableOptimization = true,
            colorMode = 'blackwhite',
            maxColors = 16
        } = options;

        const startTime = performance.now();
        
        // Pre-process image based on algorithm
        let processedCanvas = this.preprocessImage(canvas, options);
        
        // Choose tracing algorithm
        let paths = [];
        switch (algorithm) {
            case 'edge':
                paths = this.edgeBasedTracing(processedCanvas, options);
                break;
            case 'color':
                paths = this.colorBasedTracing(processedCanvas, options);
                break;
            case 'posterize':
                paths = this.posterizeTracing(processedCanvas, options);
                break;
            case 'sketch':
                paths = this.sketchTracing(processedCanvas, options);
                break;
            case 'auto':
            default:
                paths = this.autoTracing(processedCanvas, options);
                break;
        }
        
        // Post-process paths
        if (enableOptimization) {
            paths = this.optimizePaths(paths, options);
        }
        
        const endTime = performance.now();
        const processTime = (endTime - startTime) / 1000;
        
        return {
            paths,
            processTime,
            originalSize: { width: canvas.width, height: canvas.height },
            pathCount: paths.length
        };
    }

    static preprocessImage(canvas, options) {
        let processed = canvas;
        
        // Convert to grayscale for most algorithms
        if (options.colorMode === 'blackwhite' || options.colorMode === 'grayscale') {
            processed = ImageProcessor.toGrayscale(processed);
        }
        
        // Apply noise reduction
        if (options.noiseReduction > 0) {
            processed = ImageProcessor.applyGaussianBlur(processed, options.noiseReduction / 3);
        }
        
        // Adjust contrast for better edge detection
        processed = ImageProcessor.adjustContrast(processed, 20);
        
        return processed;
    }

    static autoTracing(canvas, options) {
        // Analyze image to choose best algorithm
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const complexity = this.analyzeImageComplexity(imageData);
        
        if (complexity.edges > 0.3) {
            return this.edgeBasedTracing(canvas, options);
        } else if (complexity.colors > 0.6) {
            return this.colorBasedTracing(canvas, options);
        } else {
            return this.posterizeTracing(canvas, options);
        }
    }

    static edgeBasedTracing(canvas, options) {
        const edges = EdgeDetector.sobel(canvas);
        const binary = this.imageDataToBinary(edges, options.threshold);
        const contours = this.findContours(binary, canvas.width, canvas.height);
        
        return this.contoursToPaths(contours, options);
    }

    static colorBasedTracing(canvas, options) {
        const colors = ImageProcessor.extractColors(canvas, options.maxColors);
        const paths = [];
        
        // Create paths for each color region
        for (const color of colors) {
            const mask = this.createColorMask(canvas, color, options.threshold);
            const contours = this.findContours(mask, canvas.width, canvas.height);
            const colorPaths = this.contoursToPaths(contours, options);
            
            // Add color information to paths
            colorPaths.forEach(path => {
                path.fill = color.hex;
                path.stroke = color.hex;
            });
            
            paths.push(...colorPaths);
        }
        
        return paths;
    }

    static posterizeTracing(canvas, options) {
        const posterized = this.posterizeImage(canvas, options.maxColors);
        return this.colorBasedTracing(posterized, options);
    }

    static sketchTracing(canvas, options) {
        // Convert to sketch-like image
        const grayscale = ImageProcessor.toGrayscale(canvas);
        const inverted = this.invertImage(grayscale);
        const blurred = ImageProcessor.applyGaussianBlur(inverted, 5);
        const sketch = this.colorDodge(grayscale, blurred);
        
        return this.edgeBasedTracing(sketch, { ...options, threshold: 100 });
    }

    static analyzeImageComplexity(imageData) {
        const data = imageData.data;
        let edgePixels = 0;
        let colorChanges = 0;
        let totalPixels = 0;
        
        // Simple complexity analysis
        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
            const idx = i;
            const nextIdx = i + 4;
            
            if (nextIdx < data.length) {
                const diff = Math.abs(data[idx] - data[nextIdx]) +
                            Math.abs(data[idx + 1] - data[nextIdx + 1]) +
                            Math.abs(data[idx + 2] - data[nextIdx + 2]);
                
                if (diff > 50) {
                    colorChanges++;
                }
                if (diff > 100) {
                    edgePixels++;
                }
            }
            
            totalPixels++;
        }
        
        return {
            edges: edgePixels / totalPixels,
            colors: colorChanges / totalPixels
        };
    }

    static imageDataToBinary(imageData, threshold) {
        const data = imageData.data;
        const binary = new Uint8Array(imageData.width * imageData.height);
        
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            binary[j] = data[i] < threshold ? 0 : 1;
        }
        
        return binary;
    }

    static findContours(binaryData, width, height) {
        const contours = [];
        const visited = new Uint8Array(binaryData.length);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                
                if (binaryData[idx] === 1 && !visited[idx]) {
                    const contour = this.traceContour(binaryData, visited, x, y, width, height);
                    if (contour.length > 5) {
                        contours.push(contour);
                    }
                }
            }
        }
        
        return contours;
    }

    static traceContour(binaryData, visited, startX, startY, width, height) {
        const contour = [];
        const stack = [[startX, startY]];
        const directions = [
            [1, 0], [1, 1], [0, 1], [-1, 1],
            [-1, 0], [-1, -1], [0, -1], [1, -1]
        ];
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const idx = y * width + x;
            
            if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) {
                continue;
            }
            
            if (binaryData[idx] === 1) {
                visited[idx] = 1;
                contour.push([x, y]);
                
                // Add neighboring pixels
                for (const [dx, dy] of directions) {
                    stack.push([x + dx, y + dy]);
                }
            }
        }
        
        return contour;
    }

    static contoursToPaths(contours, options) {
        return contours.map(contour => {
            const simplified = this.simplifyPath(contour, options.smoothness);
            const pathData = this.pointsToPathData(simplified);
            
            return {
                d: pathData,
                fill: 'none',
                stroke: '#000000',
                strokeWidth: 1,
                points: simplified.length
            };
        });
    }

    static simplifyPath(points, tolerance) {
        if (points.length <= 2) return points;
        
        const simplified = [];
        const tol = tolerance * tolerance;
        
        simplified.push(points[0]);
        
        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const current = points[i];
            const next = points[i + 1];
            
            // Calculate distance from point to line between prev and next
            const distance = this.pointToLineDistance(current, prev, next);
            
            if (distance > tol) {
                simplified.push(current);
            }
        }
        
        simplified.push(points[points.length - 1]);
        return simplified;
    }

    static pointToLineDistance(point, lineStart, lineEnd) {
        const A = point[0] - lineStart[0];
        const B = point[1] - lineStart[1];
        const C = lineEnd[0] - lineStart[0];
        const D = lineEnd[1] - lineStart[1];
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = lineStart[0];
            yy = lineStart[1];
        } else if (param > 1) {
            xx = lineEnd[0];
            yy = lineEnd[1];
        } else {
            xx = lineStart[0] + param * C;
            yy = lineStart[1] + param * D;
        }
        
        const dx = point[0] - xx;
        const dy = point[1] - yy;
        
        return dx * dx + dy * dy;
    }

    static pointsToPathData(points) {
        if (points.length === 0) return '';
        
        let path = `M ${points[0][0]} ${points[0][1]}`;
        
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i][0]} ${points[i][1]}`;
        }
        
        // Close path if it's a closed shape
        const first = points[0];
        const last = points[points.length - 1];
        const distance = Math.hypot(last[0] - first[0], last[1] - first[1]);
        
        if (distance < 10) {
            path += ' Z';
        }
        
        return path;
    }

    static optimizePaths(paths, options) {
        return paths.filter(path => path.points > 3)
                   .sort((a, b) => b.points - a.points)
                   .slice(0, 1000); // Limit number of paths for performance
    }

    static createColorMask(canvas, color, tolerance) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const mask = new Uint8Array(canvas.width * canvas.height);
        
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const distance = Math.sqrt(
                Math.pow(r - color.r, 2) +
                Math.pow(g - color.g, 2) +
                Math.pow(b - color.b, 2)
            );
            
            mask[j] = distance < tolerance ? 1 : 0;
        }
        
        return mask;
    }

    static posterizeImage(canvas, levels) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const step = 255 / (levels - 1);
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.round(data[i] / step) * step;
            data[i + 1] = Math.round(data[i + 1] / step) * step;
            data[i + 2] = Math.round(data[i + 2] / step) * step;
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    static invertImage(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    static colorDodge(base, blend) {
        const ctx = base.getContext('2d');
        const baseData = ctx.getImageData(0, 0, base.width, base.height);
        const blendCtx = blend.getContext('2d');
        const blendData = blendCtx.getImageData(0, 0, blend.width
