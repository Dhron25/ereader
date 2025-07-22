// server/routes.ts
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure CORS properly
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  }));

  // Ensure uploads directory exists with proper permissions
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
  }

  // Set proper headers for EPUB files and serve them statically
  app.use('/uploads', (req, res, next) => {
    // Set headers for EPUB files
    if (req.path.endsWith('.epub')) {
      res.setHeader('Content-Type', 'application/epub+zip');
      res.setHeader('Accept-Ranges', 'bytes');
    }
    
    // Set CORS headers for uploads
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    
    next();
  }, express.static(uploadsDir, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.epub')) {
        res.setHeader('Content-Type', 'application/epub+zip');
      }
    }
  }));

  // Multer configuration for EPUB files
  const storage = multer.diskStorage({
    destination: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
      cb(null, uploadsDir);
    },
    filename: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
      // Sanitize filename to prevent directory traversal
      const safeOriginalName = file.originalname.replace(/[^a-z0-9_.\-]/gi, '_').toLowerCase();
      cb(null, Date.now() + '-' + safeOriginalName);
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: function (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
      const allowedTypes = /epub/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = file.mimetype === 'application/epub+zip' || file.mimetype === 'application/zip';
      
      if (extname && (mimetype || file.originalname.toLowerCase().endsWith('.epub'))) {
        return cb(null, true);
      } else {
        cb(new Error('Only .epub files are allowed'));
      }
    }
  });

  // Upload endpoint
  app.post('/api/upload', upload.single('document'), (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File | undefined;
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded or invalid file type' });
    }
    
    // Set proper file permissions
    try {
      fs.chmodSync(file.path, 0o644);
    } catch (error) {
      console.warn('Could not set file permissions:', error);
    }
    
    res.json({ 
      success: true,
      message: 'File uploaded successfully',
      filename: file.filename,
      originalName: file.originalname
    });
  });

  // List files endpoint
  app.get('/api/files', (req, res) => {
    try {
      const files = fs.readdirSync(uploadsDir);
      
      const fileList = files
        .filter(file => path.extname(file).toLowerCase() === '.epub')
        .map(file => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            originalName: file.split('-').slice(1).join('-'),
            size: stats.size,
            mimeType: 'application/epub+zip',
            uploadDate: stats.mtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      
      res.json({ success: true, files: fileList });
    } catch (error) {
      console.error('Error reading files:', error);
      res.status(500).json({ success: false, error: 'Failed to read files' });
    }
  });

  // Serve individual EPUB file endpoint (fallback)
  app.get('/api/file/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    
    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ success: false, error: 'Invalid filename' });
    }
    
    const filePath = path.join(uploadsDir, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        
        res.setHeader('Content-Type', 'application/epub+zip');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
      } else {
        res.status(404).json({ success: false, error: 'File not found' });
      }
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ success: false, error: 'Error serving file' });
    }
  });

  // Delete file endpoint
  app.delete('/api/delete/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ success: false, error: 'Invalid filename' });
    }
    const filePath = path.join(uploadsDir, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'File deleted successfully' });
      } else {
        res.status(404).json({ success: false, error: 'File not found' });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ success: false, error: 'Error deleting file' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
  });

  const httpServer = createServer(app);
  return httpServer;
}