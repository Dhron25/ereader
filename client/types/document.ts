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
  readingTime: number;
  readingLevel: string;
}

export interface ReadingProgress {
  currentPosition: number;
  totalLength: number;
  percentage: number;
  timeRead: number;
  timeRemaining: number;
}

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: string;
}
