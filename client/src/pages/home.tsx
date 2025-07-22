// client/src/pages/home.tsx
import { useState, useCallback } from 'react';
import { AppHeader } from '@/components/app-header';
import { DocumentLibrary } from '@/components/document-library';
import { MainReader } from '@/components/main-reader';
import { Toaster } from '@/components/ui/toaster';
import { Document, DocumentStats, ReadingProgress } from '@/types/document';

export default function Home() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  // State for stats and progress can remain, as MainReader calculates them.
  // They just won't be displayed in a sidebar anymore.
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
    console.log('Document selected:', document.originalName);
    setSelectedDocument(document);
    setExtractedContent('');
    setDocumentStats({
      wordCount: 0,
      characterCount: 0,
      readingTime: 0,
      readingLevel: 'Beginner',
    });
    setReadingProgress({
      currentPosition: 0,
      totalLength: 0,
      percentage: 0,
      timeRead: 0,
      timeRemaining: 0,
    });
  }, []);

  const handleContentExtracted = useCallback((content: string) => {
    setExtractedContent(content);
  }, []);

  const handleStatsUpdate = useCallback((stats: DocumentStats) => {
    setDocumentStats(stats);
  }, []);

  const handleProgressUpdate = useCallback((progress: Partial<ReadingProgress>) => {
    setReadingProgress(prev => ({ ...prev, ...progress }));
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

        {/* The DocumentInsights component has been removed from the layout */}
      </div>
      <Toaster />
    </div>
  );
}