const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const PORT = 3000;

// Middleware 
app.use(express.json());
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /pdf|txt|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || 
                        file.mimetype === 'application/pdf' ||
                        file.mimetype === 'text/plain' ||
                        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, TXT, and DOCX files are allowed'));
        }
    }
});

// Routes
app.post('/upload', upload.single('document'), (req, res) => {
    console.log('Upload endpoint hit');
    console.log('File:', req.file);
    
    if (!req.file) {
        console.log('No file received');
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    console.log('File uploaded successfully:', req.file.filename);
    res.json({ 
        success: true,
        message: 'File uploaded successfully',
        filename: req.file.filename,
        originalName: req.file.originalname
    });
});

app.get('/files', (req, res) => {
    console.log('Files endpoint hit');
    
    try {
        const files = fs.readdirSync(uploadsDir);
        console.log('Files found:', files);
        
        const fileList = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.pdf', '.txt', '.docx'].includes(ext);
            })
            .map(file => {
                const stats = fs.statSync(path.join(uploadsDir, file));
                return {
                    filename: file,
                    originalName: file.split('-').slice(1).join('-'),
                    uploadDate: stats.mtime,
                    size: stats.size
                };
            });
        
        res.json({ success: true, files: fileList });
    } catch (error) {
        console.error('Error reading files:', error);
        res.status(500).json({ success: false, error: 'Failed to read files' });
    }
});

app.get('/read/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    console.log('Reading file:', filename);
    console.log('File path:', filePath);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log('File not found');
            return res.status(404).json({ success: false, error: 'File not found' });
        }
        
        const ext = path.extname(filename).toLowerCase();
        let content = '';
        
        if (ext === '.pdf') {
            console.log('Reading PDF file');
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            content = data.text;
        } else if (ext === '.txt') {
            console.log('Reading TXT file');
            content = fs.readFileSync(filePath, 'utf8');
        } else if (ext === '.docx') {
            console.log('Reading DOCX file');
            const result = await mammoth.extractRawText({ path: filePath });
            content = result.value;
        }
        
        console.log('Content extracted, length:', content.length);
        res.json({ success: true, content: content });
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ success: false, error: 'Error reading file: ' + error.message });
    }
});

app.delete('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('File deleted:', filename);
            res.json({ success: true, message: 'File deleted successfully' });
        } else {
            res.status(404).json({ success: false, error: 'File not found' });
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ success: false, error: 'Error deleting file' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`📁 Public directory: ${path.join(__dirname, 'public')}`);
});

