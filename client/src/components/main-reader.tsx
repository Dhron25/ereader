// client/src/components/main-reader.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ePub from "epubjs";
import { Minus, Plus, ChevronLeft, ChevronRight, BookOpen, Highlighter, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document, DocumentStats, ReadingProgress } from '@/types/document';
import { useToast } from '@/hooks/use-toast';
import { useHighlightsNotes, Note } from '@/hooks/use-highlights-notes';
import { NoteDialog } from './note-dialog';

interface MainReaderProps {
  document: Document | null;
  onContentExtracted: (content: string) => void;
  onStatsUpdate: (stats: DocumentStats) => void;
  onProgressUpdate: (progress: ReadingProgress) => void;
  bookmarks?: any[];
  addBookmark?: (position: number, text: string) => void;
  removeBookmark?: (bookmarkId: string) => void;
  getBookmarkAtPosition?: (position: number) => any;
  lastPosition?: number;
  updateLastPosition?: (position: number) => void;
}

export function MainReader({
  document,
  onContentExtracted,
  onStatsUpdate,
  onProgressUpdate,
  bookmarks = [],
  addBookmark,
  removeBookmark,
  getBookmarkAtPosition,
  lastPosition = 0,
  updateLastPosition
}: MainReaderProps) {
  const [fontSize, setFontSize] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  
  const [noteDialogState, setNoteDialogState] = useState<{
    mode: 'new' | 'edit';
    data: Note | { selectedText: string; position: string };
  } | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any | null>(null);
  const renditionRef = useRef<any | null>(null);
  const highlightModeRef = useRef(false);
  const noteModeRef = useRef(false);
  const isSetupCompleteRef = useRef(false);
  const { toast } = useToast();

  const {
    highlights,
    notes,
    addHighlight,
    addNote,
    updateNote,
  } = useHighlightsNotes(document?.filename || null);

  useEffect(() => {
    highlightModeRef.current = highlightMode;
  }, [highlightMode]);

  useEffect(() => {
    noteModeRef.current = noteMode;
  }, [noteMode]);

  const applyHighlightsAndNotesToCurrentView = useCallback(() => {
    if (!renditionRef.current || !bookRef.current) return;
    try {
      const currentView = renditionRef.current.manager?.views?._views[0];
      if (!currentView?.document) return;
      const doc = currentView.document as HTMLDocument;

      // Clear existing annotations first to prevent duplicates
      doc.querySelectorAll('[data-highlight-id], [data-note-id]').forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
          while(mark.firstChild) parent.insertBefore(mark.firstChild, mark);
          parent.removeChild(mark);
          parent.normalize();
        }
      });
      
      // Apply highlights using CFI
      highlights.forEach(highlight => {
        try {
          const range = renditionRef.current.getRange(highlight.position);
          if (range) {
            const mark = doc.createElement('mark');
            mark.style.backgroundColor = `${highlight.color}66`; // Add some transparency
            mark.style.padding = '2px 0';
            mark.setAttribute('data-highlight-id', highlight.id);
            range.surroundContents(mark);
          }
        } catch (error) {
          console.warn('Error applying highlight with CFI:', highlight.position, error);
        }
      });

      // Apply note indicators using CFI
      notes.forEach(note => {
        try {
          const range = renditionRef.current.getRange(note.position);
          if (range) {
            const noteIndicator = doc.createElement('span');
            noteIndicator.innerHTML = ' 📝';
            noteIndicator.style.cursor = 'pointer';
            noteIndicator.style.color = '#3b82f6'; // blue-500
            noteIndicator.style.fontSize = '12px';
            noteIndicator.setAttribute('data-note-id', note.id);
            noteIndicator.setAttribute('title', `Note: ${note.noteText}`);
            range.collapse(false); // Go to the end of the selection
            range.insertNode(noteIndicator);
          }
        } catch (error) {
          console.warn('Error applying note indicator with CFI:', note.position, error);
        }
      });
    } catch (error) {
      console.warn('Error in applyHighlightsAndNotesToCurrentView:', error);
    }
  }, [highlights, notes]);
  
  const handleTextSelection = useCallback((doc: HTMLDocument) => {
    try {
      const selection = doc.getSelection();
      if (!selection || selection.toString().trim().length === 0) return;

      const selectedTextContent = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const cfi = renditionRef.current.cfiFromRange(range);

      if (highlightModeRef.current) {
        addHighlight(selectedTextContent, cfi, '#ffeb3b');
        selection.removeAllRanges();
        toast({
          title: "Text highlighted",
          description: `"${selectedTextContent.substring(0, 30)}..." has been highlighted`,
        });
      } else if (noteModeRef.current) {
        setNoteDialogState({
          mode: 'new',
          data: { selectedText: selectedTextContent, position: cfi }
        });
        selection.removeAllRanges();
      }
    } catch (error) {
      console.warn('Error in handleTextSelection:', error);
      toast({ title: 'Annotation Error', description: 'Could not create annotation for this selection.', variant: 'destructive' });
    }
  }, [addHighlight, toast]);

  const handleSaveNote = useCallback((noteText: string) => {
    if (!noteDialogState) return;

    if (noteDialogState.mode === 'new') {
      const { selectedText, position } = noteDialogState.data as { selectedText: string; position: string };
      addNote(selectedText, noteText, position);
      toast({
        title: "Note saved",
        description: `Note added for "${selectedText.substring(0, 30)}..."`,
      });
    } else if (noteDialogState.mode === 'edit') {
      const noteToUpdate = noteDialogState.data as Note;
      updateNote(noteToUpdate.id, noteText);
      toast({
        title: "Note updated",
        description: `Note for "${noteToUpdate.selectedText.substring(0, 30)}..." has been updated.`,
      });
    }

    setNoteDialogState(null);
  }, [noteDialogState, addNote, updateNote, toast]);

  const setupEditingListeners = useCallback(() => {
    if (!renditionRef.current) return;

    const addListenersToView = () => {
      try {
        const currentView = renditionRef.current.manager?.views?._views[0];
        if (!currentView?.document) return;
        const doc = currentView.document as HTMLDocument;
        
        applyHighlightsAndNotesToCurrentView();

        const existingElements = Array.from(doc.querySelectorAll('[data-editable="true"]'));
        existingElements.forEach((el: Element) => {
          const newEl = el.cloneNode(true);
          el.parentNode?.replaceChild(newEl, el);
        });
        
        const textElements = doc.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li');
        textElements.forEach((element: Element) => {
          const textContent = element.textContent?.trim();
          if (!textContent || textContent.length < 10) return;
          
          element.setAttribute('data-editable', 'true');
          const el = element as HTMLElement;
          el.style.cursor = 'text';
          el.style.transition = 'background-color 0.2s ease';

          el.addEventListener('mouseenter', () => {
            if (highlightModeRef.current) el.style.backgroundColor = 'rgba(255, 235, 59, 0.2)';
            else if (noteModeRef.current) el.style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
            else el.style.backgroundColor = 'rgba(158, 158, 158, 0.1)';
          });

          el.addEventListener('mouseleave', () => {
            if (!highlightModeRef.current && !noteModeRef.current) {
              el.style.backgroundColor = '';
            }
          });
          
          el.addEventListener('mouseup', () => {
            if (highlightModeRef.current || noteModeRef.current) {
              setTimeout(() => handleTextSelection(doc), 10);
            }
          });

          el.addEventListener('dblclick', (e: Event) => {
            if (highlightModeRef.current || noteModeRef.current || !addBookmark) return;
            e.preventDefault();
            const range = doc.createRange();
            range.selectNodeContents(element);
            const cfi = new ePub.CFI(range, (renditionRef.current.currentLocation() as any)?.start?.cfi).toString();
            const location = bookRef.current.locations.locationFromCfi(cfi);
            if (location !== null) {
              addBookmark(location, textContent.substring(0, 100));
              el.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
              setTimeout(() => { el.style.backgroundColor = ''; }, 2000);
              toast({ title: "Bookmark added", description: "Text has been bookmarked" });
            }
          });
        });

        // Add click listeners for note indicators
        const noteIndicators = doc.querySelectorAll('[data-note-id]');
        noteIndicators.forEach((indicator: Element) => {
          indicator.addEventListener('click', (e: Event) => {
            e.stopPropagation();
            const noteId = indicator.getAttribute('data-note-id');
            const note = notes.find(n => n.id === noteId);
            if (note) setNoteDialogState({ mode: 'edit', data: note });
          });
        });

        isSetupCompleteRef.current = true;

      } catch (error) {
        console.error('Error adding editing listeners:', error);
      }
    };
    
    renditionRef.current.on('rendered', addListenersToView);
    if (renditionRef.current.manager?.views?._views[0]) {
      addListenersToView();
    }

  }, [addBookmark, toast, handleTextSelection, applyHighlightsAndNotesToCurrentView, notes]);
  
  const extractFullText = useCallback(async (book: any) => {
      try{
        await book.ready;
        const textChunks: string[] = [];
        for (let i = 0; i < book.spine.items.length; i++) {
          const item = book.spine.items[i];
          try {
            const contents = await item.load();
            if (contents?.body) {
              const text = contents.body.textContent || contents.body.innerText || '';
              if(text.trim().length > 50) {
                 textChunks.push(text.replace(/\s+/g, ' ').trim());
              }
            }
            if (contents && typeof contents.destroy === 'function') {
              contents.destroy();
            }
          } catch (error) {
            console.warn(`Error extracting chapter ${i}:`, error);
          }
        }
        const fullText = textChunks.join(' ');
        if (fullText) {
          onContentExtracted(fullText);
          const words = fullText.split(/\s+/).filter(word => word.length > 0);
          const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
          const wordCount = words.length;
          const characterCount = fullText.length;
          const readingTime = Math.ceil(wordCount / 200);
          let readingLevel = 'Beginner';
          if (wordCount > 10000 || avgWordsPerSentence > 20) readingLevel = 'Advanced';
          else if (wordCount > 5000 || avgWordsPerSentence > 15) readingLevel = 'Intermediate';
          const stats: DocumentStats = { wordCount, characterCount, readingTime, readingLevel };
          onStatsUpdate(stats);
          onProgressUpdate({ percentage: 0, timeRead: 0, timeRemaining: readingTime, currentPosition: 0, totalLength: characterCount });
        }
      } catch(error) {
         toast({ title: "Text extraction failed", description: "Could not extract text for analysis", variant: "destructive" });
      }
  }, [onContentExtracted, onStatsUpdate, onProgressUpdate, toast]);
  
  useEffect(() => {
    if (isSetupCompleteRef.current) {
      setTimeout(() => {
        setupEditingListeners();
      }, 100);
    }
  }, [highlights, notes, setupEditingListeners]);

  useEffect(() => {
    if (!document || !viewerRef.current) return;
    isSetupCompleteRef.current = false;
    const cleanup = () => {
      if (bookRef.current) {
        try { bookRef.current.destroy(); } catch (e) { console.warn('Error destroying book:', e); }
      }
      bookRef.current = null;
      renditionRef.current = null;
    };
    setIsLoading(true);
    const viewer = viewerRef.current;
    viewer.innerHTML = '';
    const epubUrl = `/uploads/${document.filename}`;
    const fallbackUrl = `/api/file/${document.filename}`;
    
    fetch(epubUrl, { method: 'HEAD' })
      .then(response => response.ok ? response : fetch(fallbackUrl, { method: 'HEAD' }))
      .then(response => {
        const urlToUse = response.url.includes('/api/file/') ? fallbackUrl : epubUrl;
        const book = ePub(urlToUse);
        bookRef.current = book;
        const rendition = book.renderTo(viewer, { width: viewer.clientWidth, height: viewer.clientHeight, spread: "auto", flow: "paginated" });
        renditionRef.current = rendition;
        return rendition.display();
      })
      .then(() => {
        setIsLoading(false);
        if (renditionRef.current) {
          renditionRef.current.themes.fontSize(`${fontSize}%`);
          setupEditingListeners();
          renditionRef.current.on('relocated', (location: any) => {
            setCurrentLocation(location);
            if (bookRef.current && bookRef.current.locations) {
              const progress = bookRef.current.locations.percentageFromCfi(location.start.cfi);
              onProgressUpdate({ percentage: Math.round(progress * 100), timeRead: 0, timeRemaining: 0, currentPosition: Math.round(progress * 100), totalLength: 100 });
            }
          });
          if (bookRef.current) {
            bookRef.current.locations.generate(1024).then(() => {
              console.log('Generated', bookRef.current.locations.length(), 'location points');
            });
            extractFullText(bookRef.current);
          }
        }
      })
      .catch((error: any) => {
        setIsLoading(false);
        toast({ title: "Loading failed", description: `Could not load the EPUB file: ${error.message}`, variant: "destructive" });
      });
    return cleanup;
  }, [document?.filename, extractFullText, onProgressUpdate, setupEditingListeners, toast]);

  useEffect(() => {
    if (renditionRef.current) {
      try {
        renditionRef.current.themes.fontSize(`${fontSize}%`);
      } catch (error) {
        console.warn('Error setting font size:', error);
      }
    }
  }, [fontSize]);

  const adjustFontSize = (delta: number) => setFontSize(prev => Math.max(50, Math.min(200, prev + delta)));
  const goNext = () => renditionRef.current?.next();
  const goPrev = () => renditionRef.current?.prev();

  if (!document) {
    return (
      <main className="flex-1 flex items-center justify-center bg-background min-w-0">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 primary-100 dark:primary-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">Welcome to eReader</h2>
          <p className="text-muted-foreground mb-6">Select an EPUB from your library or upload a new one to start reading and editing.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background min-w-0">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground truncate max-w-md">
          {document.originalName}
        </h1>
        <div className="flex items-center space-x-2">
          <Button
            variant={highlightMode ? "default" : "outline"}
            size="sm"
            onClick={() => { setHighlightMode(!highlightMode); setNoteMode(false); }}
            className={highlightMode ? "bg-yellow-500 text-white" : ""}
          >
            <Highlighter className="h-4 w-4 mr-1" /> Highlight
          </Button>
          <Button
            variant={noteMode ? "default" : "outline"}
            size="sm"
            onClick={() => { setNoteMode(!noteMode); setHighlightMode(false); }}
            className={noteMode ? "bg-blue-500 text-white" : ""}
          >
            <StickyNote className="h-4 w-4 mr-1" /> Note
          </Button>
          <Button variant="ghost" size="sm" onClick={goPrev}><ChevronLeft className="h-4 w-4 mr-1" /> Prev</Button>
          <Button variant="ghost" size="sm" onClick={goNext}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          <div className="flex items-center surface-200 dark:surface-700 rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={() => adjustFontSize(-10)} className="h-8 w-8 p-0"><Minus className="h-4 w-4" /></Button>
            <span className="px-3 text-sm font-medium text-foreground min-w-[3rem] text-center">{fontSize}%</span>
            <Button variant="ghost" size="sm" onClick={() => adjustFontSize(10)} className="h-8 w-8 p-0"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="px-6 py-2 bg-muted/20 border-b border-border">
        <p className="text-xs text-muted-foreground text-center">
          {highlightMode ? "🖍️ Highlight mode: Select text to automatically highlight" :
           noteMode ? "📝 Note mode: Select text to add a note" :
           "💡 Use highlight/note tools above to annotate text"}
        </p>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading and analyzing document...</p>
            </div>
          </div>
        )}
        <div ref={viewerRef} className="w-full h-full [&_iframe]:border-none" />
      </div>
      {noteDialogState && (
        <NoteDialog
          isOpen={!!noteDialogState}
          onClose={() => setNoteDialogState(null)}
          onSave={handleSaveNote}
          selectedText={noteDialogState.data.selectedText || ''}
          initialNoteText={noteDialogState.mode === 'edit' ? (noteDialogState.data as Note).noteText : ''}
        />
      )}
    </main>
  );
}

