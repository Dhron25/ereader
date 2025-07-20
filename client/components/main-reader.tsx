import { useState, useEffect } from 'react';
import { Minus, Plus, Expand, MoreVertical, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocument } from '@/hooks/use-documents';
import { Document, DocumentStats, ReadingProgress } from '@/types/document';

interface MainReaderProps {
  document: Document | null;
  onStatsUpdate: (stats: DocumentStats) => void;
  onProgressUpdate: (progress: ReadingProgress) => void;
}

export function MainReader({ document, onStatsUpdate, onProgressUpdate }: MainReaderProps) {
  const [fontSize, setFontSize] = useState(100);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const { data: documentData, isLoading } = useDocument(document?.filename || '');

  const content = documentData?.content || '';

  useEffect(() => {
    if (document && content) {
      // Calculate document stats
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = content.length;
      const readingTime = Math.ceil(wordCount / 200); // Average 200 words per minute
      const readingLevel = wordCount > 5000 ? 'Advanced' : wordCount > 2000 ? 'Intermediate' : 'Beginner';

      const stats: DocumentStats = {
        wordCount,
        characterCount,
        readingTime,
        readingLevel,
      };

      onStatsUpdate(stats);
      setStartTime(Date.now());
    }
  }, [document, content, onStatsUpdate]);

  useEffect(() => {
    if (!startTime || !content) return;

    const currentTime = Date.now();
    const timeRead = Math.floor((currentTime - startTime) / 1000 / 60); // minutes
    const totalWords = content.split(/\s+/).filter(word => word.length > 0).length;
    const totalReadingTime = Math.ceil(totalWords / 200);
    const percentage = Math.min((scrollPosition / 100) * 100, 100);
    const timeRemaining = Math.max(totalReadingTime - timeRead, 0);

    const progress: ReadingProgress = {
      currentPosition: scrollPosition,
      totalLength: content.length,
      percentage,
      timeRead,
      timeRemaining,
    };

    onProgressUpdate(progress);
  }, [scrollPosition, startTime, content, onProgressUpdate]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const position = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setScrollPosition(position);
  };

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.max(50, Math.min(200, prev + delta)));
  };

  const formatContent = (text: string) => {
    return text
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.trim().startsWith('#')) {
          const level = paragraph.match(/^#+/)?.[0].length || 1;
          const text = paragraph.replace(/^#+\s*/, '');
          const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
          return (
            <HeadingTag key={index} className={`font-bold mb-4 ${
              level === 1 ? 'text-3xl' : 
              level === 2 ? 'text-2xl' : 
              level === 3 ? 'text-xl' : 
              'text-lg'
            }`}>
              {text}
            </HeadingTag>
          );
        }
        return (
          <p key={index} className="mb-4 leading-relaxed">
            {paragraph}
          </p>
        );
      });
  };

  if (!document) {
    return (
      <main className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 primary-100 dark:primary-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">Welcome to eReader</h2>
          <p className="text-muted-foreground mb-6">
            Select a document from your library or upload a new one to start reading with our intelligent document processor.
          </p>
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Document
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {document.originalName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Loading...' : `${content.split(/\s+/).filter(word => word.length > 0).length} words • ${content.length} characters`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center surface-200 dark:surface-700 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustFontSize(-10)}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium text-foreground min-w-[3rem] text-center">
                {fontSize}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustFontSize(10)}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <Button variant="ghost" size="sm">
              <Expand className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1" onScrollCapture={handleScroll}>
        <div className="max-w-4xl mx-auto p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div 
              className="prose-reader" 
              style={{ fontSize: `${fontSize}%` }}
            >
              {formatContent(content)}
            </div>
          )}
        </div>
      </ScrollArea>
    </main>
  );
}
