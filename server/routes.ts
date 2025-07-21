import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cors());

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Statically serve the uploaded EPUB files
  app.use('/uploads', express.static(uploadsDir));

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
      const mimetype = file.mimetype === 'application/epub+zip';
      
      if (extname && mimetype) {
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
          const stats = fs.statSync(path.join(uploadsDir, file));
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

  const httpServer = createServer(app);
  return httpServer;
}