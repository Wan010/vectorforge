// Main application controller
class VectorMagicApp {
    constructor() {
        this.currentImage = null;
        this.currentSVG = null;
        this.tracingResult = null;
        this.previewManager = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Initialize components
            this.initializeEventListeners();
            this.initializePreviewManager();
            this.loadExampleImages();
            
            // Show welcome notification
            UIEffects.createNotification('Welcome to VectorMagic! 🎨', 'success', 2000);
            
        } catch (error) {
            console.error('App initialization error:', error);
            UIEffects.createNotification('Failed to initialize app', 'error');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    initializeEventListeners() {
        // File upload
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        
        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // Try example
        document.getElementById('tryExample').addEventListener('click', (e) => {
            e.preventDefault();
            this.loadRandomExample();
        });
        
        // Navigation
        document.getElementById('backToUpload').addEventListener('click', () => this.showUploadSection());
        document.getElementById('convertBtn').addEventListener('click', () => this.convertToVector());
        document.getElementById('newConversion').addEventListener('click', () => this.resetApp());
        
        // Download buttons
        document.getElementById('downloadSvg').addEventListener('click', () => this.downloadSVG());
        document.getElementById('downloadPng').addEventListener('click', () => this.downloadPNG());
        document.getElementById('downloadJpg').addEventListener('click', () => this.downloadJPG());
        document.getElementById('copySvg').addEventListener('click', () => this.copySVGCode());
        document.getElementById('shareResult').addEventListener('click', () => this.shareResult());
        
        // Control updates
        this.initializeControlListeners();
        
        // Tab switching
        this.initializeTabHandlers();
        
        // Preset buttons
        this.initializePresetButtons();
        
        // Preview controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetView').addEventListener('click', () => this.resetView());
    }

    initializeControlListeners() {
        // Range inputs with value display
        const rangeInputs = ['threshold', 'smoothness', 'noiseReduction', 'cornerThreshold', 'colorCount'];
        rangeInputs.forEach(id => {
            const input = document.getElementById(id);
            const valueDisplay = document.getElementById(id + 'Value');
            
            if (input && valueDisplay) {
                input.addEventListener('input', () => {
                    valueDisplay.textContent = input.value;
                    this.debouncedPreviewUpdate();
                });
            }
        });
        
        // Select inputs
        const selectInputs = ['algorithm', 'detailLevel', 'colorMode'];
        selectInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => this.debouncedPreviewUpdate());
            }
        });
        
        // Checkboxes
        const checkboxes = ['enableOptimization', 'optimizePaths', 'minifySvg', 'includeMetadata'];
        checkboxes.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => this.debouncedPreviewUpdate());
            }
        });
        
        // Color mode specific controls
        document.getElementById('colorMode').addEventListener('change', (e) => {
            this.toggleColorControls(e.target.value);
        });
    }

    initializeTabHandlers() {
        // Control tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchControlTab(tabName);
            });
        });
        
        // Preview tabs
        document.querySelectorAll('.preview-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const previewType = e.target.getAttribute('data-preview');
                this.switchPreviewTab(previewType);
            });
        });
        
        // Code tabs
        document.querySelectorAll('.code-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const codeType = e.target.getAttribute('data-code');
                this.switchCodeTab(codeType);
            });
        });
    }

    initializePresetButtons() {
        document.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const presetName = e.target.getAttribute('data-preset');
                ConversionPresets.applyPreset(presetName);
            });
        });
    }

    initializePreviewManager() {
        this.previewManager = new PreviewManager('vectorPreview');
    }

    debouncedPreviewUpdate = VectorUtils.debounce(() => {
        if (this.currentImage) {
            this.updateLivePreview();
        }
    }, 500);

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            await this.processFile(file);
        }
    }

    async handleFileDrop(event) {
        event.preventDefault();
        this.handleDragLeave(event);
        
        const file = event.dataTransfer.files[0];
        if (file) {
            await this.processFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    async processFile(file) {
        try {
            FileUtils.validateFile(file);
            
            UIEffects.showLoading(document.getElementById('uploadArea'), 'Loading image...');
            
            const img = await FileUtils.loadImage(file);
            const processedCanvas = await ImageProcessor.processImage(img, {
                maxWidth: 800,
                maxHeight: 600,
                quality: 'high'
            });
            
            this.currentImage = {
                original: img,
                canvas: processedCanvas,
                file: file,
                originalSize: { width: img.width, height: img.height }
            };
            
            this.displayOriginalImage(processedCanvas);
            this.showEditorSection();
            
            UIEffects.createNotification('Image loaded successfully!', 'success');
            
        } catch (error) {
            UIEffects.showError(document.getElementById('uploadArea'), error.message);
            UIEffects.createNotification(error.message, 'error');
            console.error('File processing error:', error);
        }
    }

    displayOriginalImage(canvas) {
        const originalCanvas = document.getElementById('originalCanvas');
        const fullOriginalCanvas = document.getElementById('fullOriginalCanvas');
        const comparisonOriginal = document.getElementById('comparisonOriginal');
        
        [originalCanvas, fullOriginalCanvas].forEach(targetCanvas => {
            if (targetCanvas) {
                targetCanvas.width = canvas.width;
                targetCanvas.height = canvas.height;
                const ctx = targetCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, 0);
            }
        });
        
        if (comparisonOriginal) {
            comparisonOriginal.src = canvas.toDataURL();
        }
        
        // Update image info
        const originalInfo = document.getElementById('originalInfo');
        if (originalInfo) {
            originalInfo.textContent = `${canvas.width} × ${canvas.height} pixels`;
        }
    }

    showEditorSection() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('editorSection').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        
        // Initialize color controls
        this.toggleColorControls(document.getElementById('colorMode').value);
        
        // Update live preview
        this.updateLivePreview();
    }

    showResultsSection() {
        document.getElementById('editorSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
    }

    showUploadSection() {
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('editorSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
    }

    toggleColorControls(colorMode) {
        const colorCountGroup = document.getElementById('colorCountGroup');
        const colorPalette = document.getElementById('colorPalette');
        
        if (colorMode === 'limited' || colorMode === 'custom') {
            colorCountGroup.style.display = 'block';
            this.generateColorPalette();
        } else {
            colorCountGroup.style.display = 'none';
        }
        
        if (colorMode === 'custom' && colorPalette) {
            colorPalette.style.display = 'grid';
        } else if (colorPalette) {
            colorPalette.style.display = 'none';
        }
    }

    generateColorPalette() {
        if (!this.currentImage) return;
        
        const colorCount = parseInt(document.getElementById('colorCount').value);
        const colors = ImageProcessor.extractColors(this.currentImage.canvas, colorCount);
        const paletteContainer = document.getElementById('colorPalette');
        
        if (paletteContainer) {
            paletteContainer.innerHTML = colors.map(color => 
                `<div class="color-swatch" style="background-color: ${color.hex}" title="${color.hex}"></div>`
            ).join('');
        }
    }

    async updateLivePreview() {
        if (!this.currentImage) return;
        
        const vectorPreview = document.getElementById('vectorPreview');
        UIEffects.showLoading(vectorPreview, 'Updating preview...');
        
        try {
            const options = this.getConversionOptions();
            const tracingResult = await AdvancedTracer.traceImage(this.currentImage.canvas, options);
            
            // Generate preview SVG
            const previewSVG = VectorConverter.generateSVG(tracingResult, {
                ...options,
                minify: false,
                optimizePaths: false
            });
            
            vectorPreview.innerHTML = previewSVG;
            
            // Update vector info
            const vectorInfo = document.getElementById('vectorInfo');
            if (vectorInfo) {
                vectorInfo.textContent = `${tracingResult.pathCount} paths`;
            }
            
        } catch (error) {
            UIEffects.showError(vectorPreview, 'Preview update failed');
            console.error('Preview update error:', error);
        }
    }

    async convertToVector() {
        if (!this.currentImage) return;
        
        const convertBtn = document.getElementById('convertBtn');
        const originalText = convertBtn.innerHTML;
        
        try {
            convertBtn.innerHTML = '🔄 Converting...';
            convertBtn.disabled = true;
            
            UIEffects.createNotification('Starting vector conversion...', 'info');
            
            const options = this.getConversionOptions();
            const startTime = performance.now();
            
            // Perform tracing
            this.tracingResult = await AdvancedTracer.traceImage(this.currentImage.canvas, options);
            
            // Generate final SVG
            const svgOptions = {
                optimizePaths: document.getElementById('optimizePaths').checked,
                minify: document.getElementById('minifySvg').checked,
                includeMetadata: document.getElementById('includeMetadata').checked,
                backgroundColor: document.getElementById('backgroundColor').value
            };
            
            this.currentSVG = VectorConverter.generateSVG(this.tracingResult, svgOptions);
            
            const endTime = performance.now();
            const processTime = (endTime - startTime) / 1000;
            
            // Update results
            this.displayResults(this.tracingResult, processTime);
            this.showResultsSection();
            
            UIEffects.createNotification(`Conversion completed in ${processTime.toFixed(2)}s!`, 'success');
            
        } catch (error) {
            UIEffects.createNotification('Conversion failed: ' + error.message, 'error');
            console.error('Conversion error:', error);
        } finally {
            convertBtn.innerHTML = originalText;
            convertBtn.disabled = false;
        }
    }

    getConversionOptions() {
        return {
            algorithm: document.getElementById('algorithm').value,
            threshold: parseInt(document.getElementById('threshold').value),
            smoothness: parseInt(document.getElementById('smoothness').value),
            noiseReduction: parseInt(document.getElementById('noiseReduction').value),
            cornerThreshold: parseFloat(document.getElementById('cornerThreshold').value),
            enableOptimization: document.getElementById('enableOptimization').checked,
            colorMode: document.getElementById('colorMode').value,
            maxColors: parseInt(document.getElementById('colorCount').value),
            detailLevel: document.getElementById('detailLevel').value
        };
    }

    displayResults(tracingResult, processTime) {
        // Update statistics
        document.getElementById('pathCount').textContent = tracingResult.pathCount;
        document.getElementById('processTime').textContent = VectorUtils.formatTime(processTime);
        
        const svgSize = VectorConverter.estimateFileSize(this.currentSVG);
        document.getElementById('fileSize').textContent = VectorUtils.formatFileSize(svgSize);
        
        // Display final SVG
        const finalPreview = document.getElementById('finalSvgPreview');
        finalPreview.innerHTML = this.currentSVG;
        
        // Display SVG code
        const svgCodeText = document.getElementById('svgCodeText');
        svgCodeText.textContent = this.currentSVG;
        
        // Generate and display CSS
        const cssCodeText = document.getElementById('cssCodeText');
        const cssCode = VectorConverter.generateCSS(finalPreview.querySelector('svg'), {
            includeAnimations: true
        });
        cssCodeText.textContent = cssCode;
        
        // Initialize code copy buttons
        this.initializeCopyButtons();
    }

    initializeCopyButtons() {
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetId = e.target.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const success = await FileUtils.copyToClipboard(targetElement.textContent);
                    if (success) {
                        UIEffects.createNotification('Copied to clipboard!', 'success');
                        e.target.textContent = '✅ Copied!';
                        setTimeout(() => {
                            e.target.textContent = '📋 Copy';
                        }, 2000);
                    }
                }
            });
        });
    }

    async downloadSVG() {
        if (!this.currentSVG) return;
        
        const filename = `vector-${Date.now()}.svg`;
        FileUtils.downloadSVG(this.currentSVG, filename);
        UIEffects.createNotification('SVG downloaded!', 'success');
    }

    async downloadPNG() {
        if (!this.currentSVG) return;
        
        try {
            UIEffects.createNotification('Generating PNG...', 'info');
            
            const canvas = await VectorConverter.convertToPNG(this.currentSVG, 2);
            const filename = `vector-${Date.now()}.png`;
            
            FileUtils.downloadBlob(await CanvasUtils.canvasToBlob(canvas), filename);
            UIEffects.createNotification('PNG downloaded!', 'success');
            
        } catch (error) {
            UIEffects.createNotification('PNG generation failed', 'error');
            console.error('PNG download error:', error);
        }
    }

    async downloadJPG() {
        if (!this.currentSVG) return;
        
        try {
            UIEffects.createNotification('Generating JPG...', 'info');
            
            const canvas = await VectorConverter.convertToPNG(this.currentSVG, 2);
            const blob = await VectorConverter.convertToJPG(canvas, 0.9);
            const filename = `vector-${Date.now()}.jpg`;
            
            FileUtils.downloadBlob(blob, filename);
            UIEffects.createNotification('JPG downloaded!', 'success');
            
        } catch (error) {
            UIEffects.createNotification('JPG generation failed', 'error');
            console.error('JPG download error:', error);
        }
    }

    async copySVGCode() {
        if (!this.currentSVG) return;
        
        const success = await FileUtils.copyToClipboard(this.currentSVG);
        if (success) {
            UIEffects.createNotification('SVG code copied to clipboard!', 'success');
        }
    }

    async shareResult() {
        if (!this.currentSVG) return;
        
        if (navigator.share) {
            try {
                const blob = new Blob([this.currentSVG], { type: 'image/svg+xml' });
                const file = new File([blob], 'vector-image.svg', { type: 'image/svg+xml' });
                
                await navigator.share({
                    title: 'Vector Image',
                    text: 'Check out this vector image I created with VectorMagic!',
                    files: [file]
                });
            } catch (error) {
                UIEffects.createNotification('Share cancelled', 'info');
            }
        } else {
            UIEffects.createNotification('Web Share API not supported', 'error');
        }
    }

    switchControlTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    switchPreviewTab(previewType) {
        // Update tab buttons
        document.querySelectorAll('.preview-tab').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-preview') === previewType);
        });
        
        // Update preview content
        document.querySelectorAll('.preview-box').forEach(box => {
            box.classList.toggle('active', box.id === `${previewType}-preview`);
        });
    }

    switchCodeTab(codeType) {
        // Update tab buttons
        document.querySelectorAll('.code-tab').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-code') === codeType);
        });
        
        // Update code content
        document.querySelectorAll('.code-box').forEach(box => {
            box.classList.toggle('active', box.id === `${codeType}-code`);
        });
    }

    zoomIn() {
        if (this.previewManager) {
            this.previewManager.setZoom(this.previewManager.zoomLevel * 1.2);
        }
    }

    zoomOut() {
        if (this.previewManager) {
            this.previewManager.setZoom(this.previewManager.zoomLevel / 1.2);
        }
    }

    resetView() {
        if (this.previewManager) {
            this.previewManager.resetView();
        }
    }

    loadExampleImages() {
        // This would load example images for the "try example" feature
        // In a real implementation, you'd have actual example images
        this.exampleImages = [
            // Example image URLs would go here
        ];
    }

    async loadRandomExample() {
        // Load a random example image
        // This is a placeholder - in practice, you'd have actual example images
        UIEffects.createNotification('Loading example image...', 'info');
        
        // Simulate loading an example
        setTimeout(() => {
            UIEffects.createNotification('Example feature would load a sample image', 'info');
        }, 1000);
    }

    resetApp() {
        this.currentImage = null;
        this.currentSVG = null;
        this.tracingResult = null;
        
        // Reset file input
        document.getElementById('fileInput').value = '';
        
        // Reset UI
        this.showUploadSection();
        
        // Clear previews
        document.getElementById('vectorPreview').innerHTML = '<div class="placeholder">Convert to see vector preview</div>';
        document.getElementById('finalSvgPreview').innerHTML = '';
        
        UIEffects.createNotification('Ready for new conversion!', 'info');
    }
}

// Additional CSS for dynamic elements
const dynamicStyles = `
.loading-state, .error-state, .success-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    text-align: center;
}

.loading-spinner-small {
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.notification.show {
    transform: translateX(0);
}

.notification.fade-out {
    opacity: 0;
    transform: translateX(100%);
}

.notification-success {
    border-left: 4px solid #10b981;
}

.notification-error {
    border-left: 4px solid #ef4444;
}

.notification-info {
    border-left: 4px solid #6366f1;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.slider-comparison {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.comparison-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.comparison-slider {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background: #6366f1;
    cursor: col-resize;
}

.slider-handle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 30px;
    background: #6366f1;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
`;

// Add dynamic styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.vectorMagicApp = new VectorMagicApp();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VectorMagicApp };
}
