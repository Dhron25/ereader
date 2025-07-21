import React, { useState, useEffect, useRef } from 'react';
import ePub from "epubjs";
import { Minus, Plus, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document, DocumentStats, ReadingProgress } from '@/types/document';

async function extractTextFromEpub(book: any): Promise<string> {
  await book.ready;
  const chapterTexts = await Promise.all(
    book.spine.items.map(async (item: any) => {
      try {
        const doc = await item.load();
        if (doc.body) {
          return (doc.body.textContent || "").trim();
        }
        return "";
      } catch (e) {
        console.error("Error loading chapter for text extraction: ", e);
        return ""; // Return empty string on error to not break Promise.all
      }
    })
  );
  // Join the extracted text from all chapters
  return chapterTexts.join("\n\n").replace(/\n{3,}/g, '\n\n').trim();
}

interface MainReaderProps {
  document: Document | null;
  onContentExtracted: (content: string) => void;
  onStatsUpdate: (stats: DocumentStats) => void;
  onProgressUpdate: (progress: ReadingProgress) => void;
}

export function MainReader({ document, onContentExtracted, onStatsUpdate, onProgressUpdate }: MainReaderProps) {
  const [fontSize, setFontSize] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any | null>(null);
  const renditionRef = useRef<any | null>(null);
  
  useEffect(() => {
    if (!document || !viewerRef.current) {
      if (bookRef.current) bookRef.current.destroy();
      if (viewerRef.current) viewerRef.current.innerHTML = '';
      return;
    }

    setIsLoading(true);
    const viewer = viewerRef.current;
    viewer.innerHTML = ''; 

    const book = ePub(`/uploads/${document.filename}`);
    bookRef.current = book;
    
    const rendition = book.renderTo(viewer, {
      width: viewer.clientWidth,
      height: viewer.clientHeight,
      spread: "auto",
      flow: "paginated",
    });
    renditionRef.current = rendition;

    rendition.display();
    rendition.themes.fontSize(`${fontSize}%`);

    let resizeObserver: ResizeObserver | null = null;
    
    book.ready.then(async () => {
      setIsLoading(false);
      const textContent = await extractTextFromEpub(book);
      onContentExtracted(textContent);
      
      const wordCount = textContent.split(/\s+/).filter(Boolean).length;
      const readingTime = Math.ceil(wordCount / 200);
      onStatsUpdate({ wordCount, characterCount: textContent.length, readingTime, readingLevel: wordCount > 5000 ? 'Advanced' : 'Intermediate' });

      await book.locations.generate(1650); 
      rendition.on("relocated", (location: any) => {
          const percentage = book.locations.percentageFromCfi(location.start.cfi);
          onProgressUpdate({
              percentage: Math.round(percentage * 100),
              timeRead: readingTime * percentage,
              timeRemaining: readingTime - (readingTime * percentage),
              currentPosition: 0,
              totalLength: 0,
          });
      });

      resizeObserver = new ResizeObserver(() => {
        if (renditionRef.current && viewerRef.current) {
          const { width, height } = viewerRef.current.getBoundingClientRect();
          renditionRef.current.resize(width, height);
        }
      });
      resizeObserver.observe(viewer);
    }).catch((err: Error) => {
      console.error("Error loading EPUB:", err);
      setIsLoading(false);
      viewer.innerHTML = `<div class="p-8 text-center text-destructive">Failed to load EPUB file. It might be corrupted.</div>`;
    });

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (bookRef.current) bookRef.current.destroy();
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [document, onContentExtracted, onStatsUpdate, onProgressUpdate]);

  useEffect(() => {
      if (renditionRef.current) {
          renditionRef.current.themes.fontSize(`${fontSize}%`);
      }
  }, [fontSize]);

  const adjustFontSize = (delta: number) => setFontSize(prev => Math.max(50, Math.min(200, prev + delta)));
  const goNext = () => renditionRef.current?.next();
  const goPrev = () => renditionRef.current?.prev();

  if (!document) {
    return (
      <main className="flex-1 flex items-center justify-center bg-background min-w-0">
        <div className="text-center max-w-md mx-auto p-8"><div className="w-20 h-20 primary-100 dark:primary-900 rounded-full flex items-center justify-center mx-auto mb-6"><BookOpen className="w-10 h-10 text-primary" /></div><h2 className="text-2xl font-semibold text-foreground mb-3">Welcome to eReader</h2><p className="text-muted-foreground mb-6">Select an EPUB from your library or upload a new one to start reading.</p></div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background min-w-0">
      <div className="p-6 border-b border-border flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground truncate max-w-md">{document.originalName}</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={goPrev}><ChevronLeft className="h-4 w-4 mr-1" /> Prev</Button>
            <Button variant="ghost" size="sm" onClick={goNext}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
            <div className="flex items-center surface-200 dark:surface-700 rounded-lg p-1 ml-4">
              <Button variant="ghost" size="sm" onClick={() => adjustFontSize(-10)} className="h-8 w-8 p-0"><Minus className="h-4 w-4" /></Button>
              <span className="px-3 text-sm font-medium text-foreground min-w-[3rem] text-center">{fontSize}%</span>
              <Button variant="ghost" size="sm" onClick={() => adjustFontSize(10)} className="h-8 w-8 p-0"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (<div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>)}
        <div ref={viewerRef} className="w-full h-full [&_iframe]:border-none" id="viewer" />
      </div>
    </main>
  );
}