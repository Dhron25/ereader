import { useState, useCallback } from 'react';
import { AppHeader } from '@/components/app-header';
import { DocumentLibrary } from '@/components/document-library';
import { MainReader } from '@/components/main-reader';
import { ReadingAssistant } from '@/components/reading-assistant';
import { Toaster } from '@/components/ui/toaster';
import { Document, DocumentStats, ReadingProgress } from '@/types/document';

export default function Home() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [extractedContent, setExtractedContent] = useState<string>('');
  const [documentStats, setDocumentStats] = useState<DocumentStats>({
    wordCount: 0,
    characterCount: 0,
    readingTime: 0,
    readingLevel: 'Beginner',
  });
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({
    currentPosition: 0,
    totalLength: 0,
    percentage: 0,
    timeRead: 0,
    timeRemaining: 0,
  });

  const handleDocumentSelect = useCallback((document: Document) => {
    setSelectedDocument(document);
    setExtractedContent(''); // Reset content when new document is selected
  }, []);

  const handleContentExtracted = useCallback((content: string) => {
    setExtractedContent(content);
  }, []);

  const handleStatsUpdate = useCallback((stats: DocumentStats) => {
    setDocumentStats(stats);
  }, []);

  const handleProgressUpdate = useCallback((progress: ReadingProgress) => {
    setReadingProgress(progress);
  }, []);

  return (
    <div className="min-h-screen surface-50 dark:surface-900 flex flex-col">
      <AppHeader />
      
      <div className="flex h-full flex-1 pt-16 overflow-hidden">
        <DocumentLibrary
          selectedDocument={selectedDocument}
          onDocumentSelect={handleDocumentSelect}
        />
        
        <MainReader
          document={selectedDocument}
          onContentExtracted={handleContentExtracted}
          onStatsUpdate={handleStatsUpdate}
          onProgressUpdate={handleProgressUpdate}
        />
        
        <ReadingAssistant
          document={selectedDocument}
          content={extractedContent}
          stats={documentStats}
          progress={readingProgress}
        />
      </div>
      <Toaster />
    </div>
  );
}