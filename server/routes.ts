import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";

// Dynamic import for parsers
let mammoth: any;

async function initParsers() {
  try {
    if (!mammoth) {
      mammoth = await import("mammoth");
    }
  } catch (error) {
    console.error('Error initializing parsers:', error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cors());
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Multer configuration
  const storage = multer.diskStorage({
    destination: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
      cb(null, uploadsDir);
    },
    filename: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: function (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
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

  // Upload endpoint
  app.post('/api/upload', upload.single('document'), (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File | undefined;
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
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
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.pdf', '.txt', '.docx'].includes(ext);
        })
        .map(file => {
          const stats = fs.statSync(path.join(uploadsDir, file));
          const ext = path.extname(file).toLowerCase();
          let mimeType = 'application/octet-stream';
          
          if (ext === '.pdf') mimeType = 'application/pdf';
          else if (ext === '.txt') mimeType = 'text/plain';
          else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          
          return {
            filename: file,
            originalName: file.split('-').slice(1).join('-'),
            size: stats.size,
            mimeType,
            uploadDate: stats.mtime.toISOString(),
          };
        });
      
      res.json({ success: true, files: fileList });
    } catch (error) {
      console.error('Error reading files:', error);
      res.status(500).json({ success: false, error: 'Failed to read files' });
    }
  });

  // Read file endpoint
  app.get('/api/read/:filename', async (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    try {
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }
      
      // Initialize parsers if needed
      await initParsers();
      
      const ext = path.extname(filename).toLowerCase();
      let content = '';
      
      if (ext === '.pdf') {
        // For now, handle PDFs with basic info until we fix the parsing
        const stats = fs.statSync(filePath);
        content = `PDF Document\nFile: ${filename}\nSize: ${Math.round(stats.size / 1024)} KB\nUploaded: ${new Date().toLocaleString()}\n\n[PDF text extraction will be implemented with a working PDF parser]`;
      } else if (ext === '.txt') {
        content = fs.readFileSync(filePath, 'utf8');
      } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        content = result.value;
      }
      
      res.json({ success: true, content: content });
    } catch (error) {
      console.error('Error reading file:', error);
      res.status(500).json({ success: false, error: 'Error reading file: ' + (error as Error).message });
    }
  });

  // Delete file endpoint
  app.delete('/api/delete/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
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
