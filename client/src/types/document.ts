export interface Document {
  id: number;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  content?: string;
}

export interface DocumentStats {
  wordCount: number;
  characterCount: number;
  readingTime: number; // in minutes
  readingLevel: string;
}

export interface ReadingProgress {
  currentPosition: number;
  totalLength: number;
  percentage: number;
  timeRead: number; // in minutes
  timeRemaining: number; // in minutes
}

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: string;
}

export interface Bookmark {
  id: string;
  documentId: string;
  cfi: string;
  text: string;
  timestamp: string;
  title?: string;
}