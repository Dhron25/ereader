class BookReaderApp {
    constructor() {
        this.currentText = '';
        this.currentFilename = null;
        this.currentDocument = null;
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.isPlaying = false;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupTheme();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadFiles();
        this.setupVoiceControls();
    }

    setupTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            document.querySelector('.theme-toggle i').classList.replace('fa-moon', 'fa-sun');
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.querySelector('.theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Upload form
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadFile();
        });

        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Voice controls
        document.getElementById('playBtn').addEventListener('click', () => this.playText());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseText());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopText());

        // Speed control
        document.getElementById('speedControl').addEventListener('input', (e) => {
            this.updateSpeed(e.target.value);
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadFiles();
        });

        // Fullscreen toggle
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Font size toggle
        document.getElementById('fontSizeBtn').addEventListener('click', () => {
            this.cycleFontSize();
        });
    }

    setupDragAndDrop() {
        const uploadLabel = document.querySelector('.file-upload-label');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadLabel.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadLabel.addEventListener(eventName, () => {
                uploadLabel.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadLabel.addEventListener(eventName, () => {
                uploadLabel.classList.remove('dragover');
            }, false);
        });

        uploadLabel.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('fileInput').files = files;
                this.handleFileSelect(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.isDarkMode);
        
        const themeIcon = document.querySelector('.theme-toggle i');
        if (this.isDarkMode) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    }

    handleFileSelect(file) {
        if (!file) return;
        
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        fileInfo.style.display = 'flex';
        
        // Hide the upload label
        document.querySelector('.file-upload-label').style.display = 'none';
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    async uploadFile() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('Please select a file to upload.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('document', file);

        this.showLoadingOverlay('Uploading document...');
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast('Document uploaded successfully!', 'success');
                this.resetUploadForm();
                this.loadFiles();
            } else {
                this.showToast(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            this.showToast('Error uploading file: ' + error.message, 'error');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    resetUploadForm() {
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfo').style.display = 'none';
        document.querySelector('.file-upload-label').style.display = 'flex';
    }

    async loadFiles() {
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading documents...</span>
            </div>
        `;

        try {
            const response = await fetch('/files');
            const files = await response.json();
            
            if (files.length === 0) {
                filesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <span>No documents found</span>
                        <small>Upload your first document to get started</small>
                    </div>
                `;
                return;
            }

            filesList.innerHTML = files.map(file => `
                <div class="file-item ${file.filename === this.currentFilename ? 'active' : ''}" 
                     data-filename="${file.filename}">
                    <div class="file-info-container">
                        <div class="file-name">${file.originalName}</div>
                        <div class="file-meta">
                            ${this.formatFileSize(file.size)} • 
                            ${new Date(file.uploadDate).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="button ghost-button" onclick="app.readFile('${file.filename}', '${file.originalName}')">
                            <i class="fas fa-book-open"></i> Read
                        </button>
                        <button class="button ghost-button" onclick="app.deleteFile('${file.filename}', '${file.originalName}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Error loading documents</span>
                    <small>${error.message}</small>
                </div>
            `;
            this.showToast('Error loading files: ' + error.message, 'error');
        }
    }

    async readFile(filename, originalName) {
        this.stopText();
        this.currentFilename = filename;
        this.currentDocument = { filename, originalName };

        this.showLoadingOverlay('Loading document...');
        
        const bookContent = document.getElementById('bookContent');
        const readerInfo = document.getElementById('readerInfo');
        const currentDocumentName = document.getElementById('currentDocumentName');
        
        try {
            const response = await fetch(`/read/${filename}`);
            const result = await response.json();

            if (response.ok) {
                this.currentText = result.content.trim();
                
                if (this.currentText === '') {
                    bookContent.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-file-alt"></i>
                            <span>Document is empty</span>
                            <small>This document could not be parsed or contains no readable text</small>
                        </div>
                    `;
                    this.showToast('Document appears to be empty', 'warning');
                } else {
                    bookContent.textContent = this.currentText;
                    
                    // Update reader info
                    currentDocumentName.textContent = originalName;
                    document.getElementById('documentStats').textContent = 
                        `${this.currentText.split(' ').length} words • ${this.currentText.length} characters`;
                    readerInfo.style.display = 'flex';
                    
                    // Update file list active state
                    document.querySelectorAll('.file-item').forEach(item => {
                        item.classList.toggle('active', item.dataset.filename === filename);
                    });
                    
                    this.showToast('Document loaded successfully!', 'success');
                }
            } else {
                bookContent.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Error loading document</span>
                        <small>${result.error || 'Unknown error'}</small>
                    </div>
                `;
                this.showToast(result.error || 'Failed to read file', 'error');
            }
        } catch (error) {
            bookContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Error loading document</span>
                    <small>${error.message}</small>
                </div>
            `;
            this.showToast('Error reading file: ' + error.message, 'error');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    async deleteFile(filename, originalName) {
        if (!confirm(`Are you sure you want to delete "${originalName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/delete/${filename}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast('Document deleted successfully!', 'success');
                this.loadFiles();
                
                // Clear reader if this was the current document
                if (this.currentFilename === filename) {
                    this.currentText = '';
                    this.currentFilename = null;
                    this.currentDocument = null;
                    document.getElementById('bookContent').innerHTML = `
                        <div class="welcome-message">
                            <div class="welcome-icon">📖</div>
                            <h3>Welcome to eReader</h3>
                            <p>Upload a document from the sidebar to start reading, or select from your library.</p>
                        </div>
                    `;
                    document.getElementById('readerInfo').style.display = 'none';
                }
            } else {
                this.showToast(result.error || 'Failed to delete file', 'error');
            }
        } catch (error) {
            this.showToast('Error deleting file: ' + error.message, 'error');
        }
    }

    setupVoiceControls() {
        // Check if speech synthesis is available
        if (!this.speechSynthesis) {
            document.querySelector('.voice-controls').style.display = 'none';
            this.showToast('Speech synthesis not available in this browser', 'warning');
        }
    }

    playText() {
        if (!this.currentText) {
            this.showToast('No text to read. Please load a document first.', 'error');
            return;
        }

        if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
            this.showToast('Already playing!', 'info');
            return;
        }

        if (this.speechSynthesis.paused) {
            this.speechSynthesis.resume();
            this.isPlaying = true;
            this.showToast('Reading resumed', 'info');
            this.updatePlayButton(true);
            return;
        }

        this.currentUtterance = new SpeechSynthesisUtterance(this.currentText);
        this.currentUtterance.rate = parseFloat(document.getElementById('speedControl').value);
        this.currentUtterance.pitch = 1;
        this.currentUtterance.volume = 1;

        this.currentUtterance.onend = () => {
            this.isPlaying = false;
            this.updatePlayButton(false);
            this.showToast('Finished reading', 'info');
        };

        this.currentUtterance.onerror = (event) => {
            this.isPlaying = false;
            this.updatePlayButton(false);
            this.showToast('Speech error occurred', 'error');
        };

        this.speechSynthesis.speak(this.currentUtterance);
        this.isPlaying = true;
        this.updatePlayButton(true);
        this.showToast('Reading started', 'success');
    }

    pauseText() {
        if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
            this.speechSynthesis.pause();
            this.isPlaying = false;
            this.updatePlayButton(false);
            this.showToast('Reading paused', 'info');
        }
    }

    stopText() {
        if (this.speechSynthesis.speaking || this.speechSynthesis.paused) {
            this.speechSynthesis.cancel();
            this.isPlaying = false;
            this.updatePlayButton(false);
            this.showToast('Reading stopped', 'info');
        }
    }

    updatePlayButton(isPlaying) {
        const playBtn = document.getElementById('playBtn');
        const icon = playBtn.querySelector('i');
        
        if (isPlaying) {
            icon.classList.replace('fa-play', 'fa-pause');
            playBtn.title = 'Pause Reading';
        } else {
            icon.classList.replace('fa-pause', 'fa-play');
            playBtn.title = 'Play Reading';
        }
    }

    updateSpeed(value) {
        document.getElementById('speedValue').textContent = value + 'x';
        
        if (this.currentUtterance && this.isPlaying) {
            this.currentUtterance.rate = parseFloat(value);
        }
    }

    toggleFullscreen() {
        const contentDisplay = document.getElementById('bookContent');
        
        if (!document.fullscreenElement) {
            contentDisplay.requestFullscreen().catch(err => {
                this.showToast('Could not enter fullscreen mode', 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }

    cycleFontSize() {
        const contentDisplay = document.getElementById('bookContent');
        const currentSize = parseInt(getComputedStyle(contentDisplay).fontSize);
        
        let newSize;
        if (currentSize <= 16) newSize = 18;
        else if (currentSize <= 18) newSize = 20;
        else if (currentSize <= 20) newSize = 22;
        else newSize = 16;
        
        contentDisplay.style.fontSize = newSize + 'px';
        this.showToast(`Font size: ${newSize}px`, 'info');
    }

    showLoadingOverlay(message) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.querySelector('span').textContent = message;
        overlay.style.display = 'flex';
    }

    hideLoadingOverlay() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize the app    
const app = new BookReaderApp();