class BookReaderApp {
    constructor() {
        this.currentText = '';
        this.currentFilename = null; // To keep track of the currently loaded file
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.isPlaying = false;
        
        this.initializeEventListeners();
        this.loadFiles();
    }

    initializeEventListeners() {
        // Upload form
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadFile();
        });

        // Voice controls
        document.getElementById('playBtn').addEventListener('click', () => {
            this.playText();
        });

        // Pause button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseText();
        });

        // Stop button
        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopText();
        });

        // Speed control
        const speedControl = document.getElementById('speedControl');
        speedControl.addEventListener('input', (e) => {
            document.getElementById('speedValue').textContent = e.target.value + 'x';
            if (this.currentUtterance && this.isPlaying) {
                this.currentUtterance.rate = parseFloat(e.target.value);
                // If speech is currently ongoing, cancel and restart with new rate
                // This ensures the speed change is applied immediately
                if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
                    this.speechSynthesis.cancel();
                    this.speechSynthesis.speak(this.currentUtterance);
                }
            }
        });

        // Update file input label when a file is selected
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const fileName = e.target.files[0] ? e.target.files[0].name : 'Choose File';
            document.querySelector('.custom-file-upload').innerHTML = `<i class="fas fa-file-upload"></i> ${fileName}`;
        });
    }

    async uploadFile() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showNotification('Please select a file to upload.', 'error');
            return;
        }

        // Reset custom file upload label
        document.querySelector('.custom-file-upload').innerHTML = '<i class="fas fa-file-upload"></i> Choose File';

        const formData = new FormData();
        formData.append('document', file);

        this.showNotification('Uploading file...', 'info');
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('File uploaded successfully!', 'success');
                fileInput.value = ''; // Clear file input
                this.loadFiles(); // Reload files list
            } else {
                this.showNotification(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            this.showNotification('Error uploading file: ' + error.message, 'error');
        }
    }

    async loadFiles() {
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading files...</p>'; // Show loading indicator

        try {
            const response = await fetch('/files');
            const files = await response.json();
            
            if (files.length === 0) {
                filesList.innerHTML = '<p class="empty-message">No documents found. Upload one to get started!</p>';
                return;
            }

            // Sort files by originalName alphabetically for a cleaner list
            files.sort((a, b) => a.originalName.localeCompare(b.originalName));

            filesList.innerHTML = files.map(file => `
                <div class="file-item ${file.filename === this.currentFilename ? 'active' : ''}" data-filename="${file.filename}">
                    <span class="file-name"><i class="fas fa-file-alt"></i> ${file.originalName}</span>
                    <button onclick="app.readFile('${file.filename}')" class="button ghost-button read-button" title="Open document">
                        <i class="fas fa-book-open"></i> Read
                    </button>
                </div>
            `).join('');

            // Highlight the currently active file if any
            if (this.currentFilename) {
                const activeFileItem = document.querySelector(`.file-item[data-filename="${this.currentFilename}"]`);
                if (activeFileItem) {
                    activeFileItem.classList.add('active');
                }
            }

        } catch (error) {
            console.error('Error loading files:', error);
            filesList.innerHTML = '<p class="error-message"><i class="fas fa-exclamation-triangle"></i> Failed to load files.</p>';
            this.showNotification('Error loading files: ' + error.message, 'error');
        }
    }

    async readFile(filename) {
        this.stopText(); // Stop any ongoing speech
        this.currentFilename = filename; // Set the current filename

        const bookContent = document.getElementById('bookContent');
        bookContent.innerHTML = '<div class="loading-content"><i class="fas fa-spinner fa-spin"></i> Loading document...</div>';
        bookContent.classList.remove('placeholder-text'); // Remove placeholder class

        // Remove active class from all file items, then add to the clicked one
        document.querySelectorAll('.file-item').forEach(item => item.classList.remove('active'));
        const clickedFileItem = document.querySelector(`.file-item[data-filename="${filename}"]`);
        if (clickedFileItem) {
            clickedFileItem.classList.add('active');
        }

        try {
            const response = await fetch(`/read/${filename}`);
            const result = await response.json();

            if (response.ok) {
                this.currentText = result.content.trim(); // Trim whitespace
                if (this.currentText === '') {
                    bookContent.innerHTML = '<p class="empty-content-message">This document appears to be empty or could not be fully parsed.</p>';
                    this.showNotification('Document is empty or could not be parsed.', 'warning');
                } else {
                    // Use innerText to preserve line breaks and prevent HTML injection from parsed text
                    bookContent.innerText = this.currentText; 
                    this.showNotification('File loaded successfully! Click Play to listen.', 'success');
                }
            } else {
                bookContent.innerHTML = `<p class="error-message"><i class="fas fa-exclamation-triangle"></i> Error loading file: ${result.error || 'Unknown error'}</p>`;
                this.currentText = ''; // Clear current text on error
                this.showNotification(result.error || 'Failed to read file', 'error');
            }
        } catch (error) {
            bookContent.innerHTML = `<p class="error-message"><i class="fas fa-exclamation-triangle"></i> Error reading file: ${error.message}</p>`;
            this.currentText = ''; // Clear current text on error
            this.showNotification('Error reading file: ' + error.message, 'error');
        }
    }

    playText() {
        if (!this.currentText) {
            this.showNotification('No text to read. Please load a document first.', 'error');
            return;
        }

        if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
            this.showNotification('Already playing!', 'info');
            return;
        }

        if (this.speechSynthesis.paused) {
            this.speechSynthesis.resume();
            this.isPlaying = true;
            this.showNotification('Reading resumed...', 'info');
            return;
        }

        // If nothing is speaking or paused, start a new utterance
        this.currentUtterance = new SpeechSynthesisUtterance(this.currentText);
        this.currentUtterance.rate = parseFloat(document.getElementById('speedControl').value);
        this.currentUtterance.pitch = 1;
        this.currentUtterance.volume = 1;

        this.currentUtterance.onend = () => {
            this.isPlaying = false;
            this.showNotification('Finished reading', 'info');
        };

        this.currentUtterance.onerror = (event) => {
            this.isPlaying = false;
            let errorMessage = 'An unknown speech error occurred.';
            if (event.error) {
                errorMessage = `Speech error: ${event.error}`;
            } else if (event.message) {
                 errorMessage = `Speech error: ${event.message}`;
            }
            this.showNotification(errorMessage, 'error');
            console.error('Speech synthesis error:', event);
        };

        this.speechSynthesis.speak(this.currentUtterance);
        this.isPlaying = true;
        this.showNotification('Reading started...', 'success');
    }

    pauseText() {
        if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
            this.speechSynthesis.pause();
            this.isPlaying = false;
            this.showNotification('Reading paused', 'info');
        } else if (this.speechSynthesis.paused) {
            this.showNotification('Already paused!', 'info');
        } else {
            this.showNotification('Nothing to pause.', 'warning');
        }
    }

    stopText() {
        if (this.speechSynthesis.speaking || this.speechSynthesis.paused) {
            this.speechSynthesis.cancel();
            this.isPlaying = false;
            this.showNotification('Reading stopped', 'info');
        } else {
            this.showNotification('Nothing is playing or paused.', 'warning');
        }
    }

    // Unified notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notificationArea = document.getElementById('notificationArea');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : ''}
                ${type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : ''}
                ${type === 'info' ? '<i class="fas fa-info-circle"></i>' : ''}
                ${type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
            </div>
            <span class="notification-message">${message}</span>
            <button class="close-notification-btn" onclick="this.parentElement.remove()" title="Close Notification"><i class="fas fa-times"></i></button>
        `;
        
        notificationArea.appendChild(notification);

        // Auto-remove notification after a duration
        setTimeout(() => {
            notification.classList.add('hide'); // Start fade out
            notification.addEventListener('transitionend', () => notification.remove()); // Remove after animation
        }, duration);
    }
}

// Initialize the app when the page loads
const app = new BookReaderApp();