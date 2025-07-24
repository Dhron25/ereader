// client/src/components/main-reader.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ePub from "epubjs";
import { Minus, Plus, ChevronLeft, ChevronRight, BookOpen, Highlighter, StickyNote, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document, DocumentStats, ReadingProgress } from '@/types/document';
import { useToast } from '@/hooks/use-toast';
import { useHighlightsNotes } from '@/hooks/use-highlights-notes';
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
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteDialogData, setNoteDialogData] = useState<{
    selectedText: string;
    position: { x: number; y: number };
    selectionPosition: number;
    isEditing?: boolean;
    existingNote?: any;
  } | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any | null>(null);
  const renditionRef = useRef<any | null>(null);
  const highlightModeRef = useRef(false);
  const noteModeRef = useRef(false);
  const isSetupCompleteRef = useRef(false);
  const { toast } = useToast();

  // Use highlights and notes hook
  const {
    highlights,
    notes,
    addHighlight,
    addNote,
    removeHighlight,
    removeNote
  } = useHighlightsNotes(document?.filename || null);

  // Update refs when state changes
  useEffect(() => {
    highlightModeRef.current = highlightMode;
  }, [highlightMode]);

  useEffect(() => {
    noteModeRef.current = noteMode;
  }, [noteMode]);

  // Helper function to apply text annotations
  const applyTextAnnotation = useCallback((doc: HTMLDocument, targetText: string, type: 'highlight' | 'note', id: string, color: string, noteData?: any) => {
    const textElements = doc.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li');
    
    // Use first 30 characters for better matching
    const searchText = targetText.substring(0, 30).trim();
    
    for (const element of Array.from(textElements)) {
      if (!element.textContent || !element.textContent.includes(searchText)) continue;
      
      const walker = doc.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while (node = walker.nextNode()) {
        const textNode = node as Text;
        const text = textNode.textContent || '';
        const index = text.indexOf(searchText);

        if (index !== -1) {
          try {
            const range = doc.createRange();
            range.setStart(textNode, index);
            range.setEnd(textNode, Math.min(index + searchText.length, text.length));

            const span = doc.createElement('span');
            
            if (type === 'highlight') {
              span.style.backgroundColor = `${color}66`;
              span.style.padding = '2px 0';
              span.setAttribute('data-highlight-id', id);
            } else if (type === 'note') {
              span.style.backgroundColor = '#e3f2fd';
              span.style.padding = '2px 4px';
              span.style.borderRadius = '3px';
              span.style.cursor = 'pointer';
              span.style.border = '1px solid #2196f3';
              span.style.position = 'relative';
              span.setAttribute('data-note-id', id);
              span.setAttribute('title', `Click to view note: ${noteData?.noteText?.substring(0, 50)}...`);
              
              // Add note icon
              const icon = doc.createElement('span');
              icon.innerHTML = '📝';
              icon.style.position = 'absolute';
              icon.style.right = '-2px';
              icon.style.top = '-8px';
              icon.style.fontSize = '10px';
              icon.style.backgroundColor = '#2196f3';
              icon.style.color = 'white';
              icon.style.borderRadius = '50%';
              icon.style.width = '16px';
              icon.style.height = '16px';
              icon.style.display = 'flex';
              icon.style.alignItems = 'center';
              icon.style.justifyContent = 'center';
              icon.style.zIndex = '1000';
              
              // Add click handler for notes
              span.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                handleNoteClick(noteData);
              });
              
              span.appendChild(icon);
            }

            range.surroundContents(span);
            return; // Found and applied, exit
          } catch (e) {
            console.warn('Could not apply annotation:', e);
          }
        }
      }
    }
  }, []);

  // Handle clicking on existing notes
  const handleNoteClick = useCallback((noteData: any) => {
    setNoteDialogData({
      selectedText: noteData.selectedText,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      selectionPosition: noteData.position,
      isEditing: true,
      existingNote: noteData
    });
    setShowNoteDialog(true);
  }, []);

  // Apply existing highlights and notes to the rendered content
  const applyHighlightsAndNotesToCurrentView = useCallback(() => {
    if (!renditionRef.current) return;

    try {
      const currentView = renditionRef.current.manager?.views?._views[0];
      if (!currentView?.document) return;

      const doc = currentView.document as HTMLDocument;

      // Clear existing annotations first
      const existingMarks = doc.querySelectorAll('[data-highlight-id], [data-note-id]');
      existingMarks.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(doc.createTextNode(mark.textContent || ''), mark);
          parent.normalize();
        }
      });

      // Apply highlights
      highlights.forEach(highlight => {
        try {
          applyTextAnnotation(doc, highlight.text, 'highlight', highlight.id, highlight.color);
        } catch (error) {
          console.warn('Error applying highlight:', error);
        }
      });

      // Apply notes with note icons
      notes.forEach(note => {
        try {
          applyTextAnnotation(doc, note.selectedText, 'note', note.id, '#e3f2fd', note);
        } catch (error) {
          console.warn('Error applying note:', error);
        }
      });
    } catch (error) {
      console.warn('Error in applyHighlightsAndNotesToCurrentView:', error);
    }
  }, [highlights, notes, applyTextAnnotation, handleNoteClick]);

  // Handle text selection for highlighting and notes
  const handleTextSelection = useCallback((doc: HTMLDocument, event: MouseEvent) => {
    try {
      const selection = doc.getSelection();
      if (!selection || selection.toString().trim().length === 0) return;

      const selectedTextContent = selection.toString().trim();
      const range = selection.getRangeAt(0);

      const rect = range.getBoundingClientRect();
      const position = { x: rect.left, y: rect.bottom };
      const selectionPosition = Math.floor(Math.random() * 1000);

      if (highlightModeRef.current) {
        try {
          const mark = doc.createElement('mark');
          mark.style.backgroundColor = 'rgba(255, 235, 59, 0.6)';
          mark.style.padding = '2px 0';
          mark.setAttribute('data-highlight-id', `temp_${Date.now()}`);
          range.surroundContents(mark);

          const highlight = addHighlight(selectedTextContent, selectionPosition, '#ffeb3b');
          if (highlight) {
            mark.setAttribute('data-highlight-id', highlight.id);
          }

          selection.removeAllRanges();

          toast({
            title: "Text highlighted",
            description: `"${selectedTextContent.substring(0, 30)}..." has been highlighted`,
          });
        } catch (error) {
          console.warn('Could not highlight selection:', error);
          toast({
            title: "Highlighting failed",
            description: "Could not highlight the selected text",
            variant: "destructive"
          });
        }
      } else if (noteModeRef.current) {
        setNoteDialogData({
          selectedText: selectedTextContent,
          position,
          selectionPosition,
          isEditing: false
        });
        setShowNoteDialog(true);
        selection.removeAllRanges();
      }
    } catch (error) {
      console.warn('Error in handleTextSelection:', error);
    }
  }, [addHighlight, toast]);

  // Handle note save/update
  const handleNoteSave = useCallback((noteText: string) => {
    if (!noteDialogData) return;

    if (noteDialogData.isEditing && noteDialogData.existingNote) {
      // Update existing note
      removeNote(noteDialogData.existingNote.id);
      const updatedNote = addNote(noteDialogData.selectedText, noteText, noteDialogData.selectionPosition);
      
      if (updatedNote) {
        toast({
          title: "Note updated",
          description: `Note for "${noteDialogData.selectedText.substring(0, 30)}..." has been updated`,
        });
      }
    } else {
      // Create new note
      const note = addNote(noteDialogData.selectedText, noteText, noteDialogData.selectionPosition);

      if (note) {
        toast({
          title: "Note saved",
          description: `Note added for "${noteDialogData.selectedText.substring(0, 30)}..."`,
        });
      }
    }

    // Apply the note immediately without re-rendering
    setTimeout(() => {
      applyHighlightsAndNotesToCurrentView();
    }, 100);

    setNoteDialogData(null);
  }, [noteDialogData, addNote, removeNote, toast, applyHighlightsAndNotesToCurrentView]);

  // Handle note deletion
  const handleNoteDelete = useCallback(() => {
    if (!noteDialogData?.existingNote) return;

    removeNote(noteDialogData.existingNote.id);
    
    toast({
      title: "Note deleted",
      description: "Note has been removed",
    });

    setTimeout(() => {
      applyHighlightsAndNotesToCurrentView();
    }, 100);

    setNoteDialogData(null);
  }, [noteDialogData, removeNote, toast, applyHighlightsAndNotesToCurrentView]);

  // Setup editing listeners
  const setupEditingListeners = useCallback(() => {
    if (!renditionRef.current) return;

    const addListenersToView = () => {
      try {
        const currentView = renditionRef.current.manager?.views?._views[0];
        if (!currentView?.document) return;

        const doc = currentView.document as HTMLDocument;

        // Add CSS to improve text rendering
        const style = doc.createElement('style');
        style.textContent = `
          body {
            line-height: 1.6 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
          p {
            margin-bottom: 1em !important;
            line-height: 1.6 !important;
            text-align: justify !important;
          }
          div {
            line-height: 1.6 !important;
          }
          * {
            box-sizing: border-box !important;
          }
          span {
            word-wrap: break-word !important;
          }
        `;
        doc.head.appendChild(style);

        // Apply existing highlights and notes
        applyHighlightsAndNotesToCurrentView();

        // Remove existing listeners
        const existingElements = doc.querySelectorAll('[data-editable="true"]');
        existingElements.forEach((el: Element) => {
          el.removeAttribute('data-editable');
          (el as any).onclick = null;
          (el as any).ondblclick = null;
          (el as any).onmouseup = null;
          (el as any).onmouseenter = null;
          (el as any).onmouseleave = null;
        });

        // Add listeners to text elements
        const textElements = doc.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li');

        textElements.forEach((element: Element) => {
          const textContent = element.textContent?.trim();
          if (!textContent || textContent.length < 10) return;

          element.setAttribute('data-editable', 'true');
          (element as HTMLElement).style.cursor = 'text';
          (element as HTMLElement).style.transition = 'background-color 0.2s ease';

          // Hover effects
          element.addEventListener('mouseenter', () => {
            if (highlightModeRef.current) {
              (element as HTMLElement).style.backgroundColor = 'rgba(255, 235, 59, 0.2)';
            } else if (noteModeRef.current) {
              (element as HTMLElement).style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
            } else {
              (element as HTMLElement).style.backgroundColor = 'rgba(158, 158, 158, 0.1)';
            }
          });

          element.addEventListener('mouseleave', () => {
            if (!highlightModeRef.current && !noteModeRef.current) {
              (element as HTMLElement).style.backgroundColor = '';
            }
          });

          // Handle text selection
          element.addEventListener('mouseup', (e: Event) => {
            const mouseEvent = e as MouseEvent;
            if (highlightModeRef.current || noteModeRef.current) {
              setTimeout(() => {
                handleTextSelection(doc, mouseEvent);
              }, 10);
            }
          });

          // Double-click for bookmark
          element.addEventListener('dblclick', (e: Event) => {
            if (highlightModeRef.current || noteModeRef.current) return;

            e.preventDefault();

            if (addBookmark) {
              const position = Math.floor(Math.random() * 1000);
              addBookmark(position, textContent.substring(0, 100));

              (element as HTMLElement).style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
              setTimeout(() => {
                (element as HTMLElement).style.backgroundColor = '';
              }, 2000);

              toast({
                title: "Bookmark added",
                description: "Text has been bookmarked",
              });
            }
          });
        });

        console.log(`Added editing listeners to ${textElements.length} elements`);
        isSetupCompleteRef.current = true;

      } catch (error) {
        console.error('Error adding editing listeners:', error);
      }
    };

    renditionRef.current.on('rendered', addListenersToView);

    if (renditionRef.current.manager?.views?._views[0]) {
      addListenersToView();
    }
  }, [addBookmark, toast, handleTextSelection, applyHighlightsAndNotesToCurrentView]);

  // Extract full text from EPUB for analysis
  const extractFullText = useCallback(async (book: any) => {
    try {
      await book.ready;
      const textChunks: string[] = [];

      console.log('Extracting text from', book.spine.items.length, 'chapters');

      for (let i = 0; i < book.spine.items.length; i++) {
        const item = book.spine.items[i];
        try {
          const contents = await item.load();
          if (contents?.body) {
            // Better text extraction with encoding handling
            let text = '';
            
            // Try different methods to extract clean text
            if (contents.body.textContent) {
              text = contents.body.textContent;
            } else if (contents.body.innerText) {
              text = contents.body.innerText;
            } else {
              // Fallback: extract text from HTML manually
              const htmlContent = contents.body.innerHTML || '';
              text = htmlContent
                .replace(/<[^>]*>/g, ' ') // Remove HTML tags
                .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
                .replace(/&amp;/g, '&') // Replace HTML entities
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
            }
            
            // Clean and normalize the text
            if (text.trim().length > 50) {
              const cleanedText = text
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/[\u2000-\u206F\u2E00-\u2E7F\u0000-\u001F\u007F-\u009F]/g, '') // Remove special Unicode characters
                .replace(/[^\x20-\x7E\u00A0-\u024F\u0400-\u04FF]/g, '') // Keep only printable ASCII and basic Latin/Cyrillic
                .trim();
                
              if (cleanedText.length > 50) {
                textChunks.push(cleanedText);
              }
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
      console.log('Extracted text length:', fullText.length);

      if (fullText) {
        onContentExtracted(fullText);

        const words = fullText.split(/\s+/).filter(word => word.length > 0);
        const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;

        const wordCount = words.length;
        const characterCount = fullText.length;
        const readingTime = Math.ceil(wordCount / 200);

        let readingLevel = 'Beginner';
        if (wordCount > 10000 || avgWordsPerSentence > 20) {
          readingLevel = 'Advanced';
        } else if (wordCount > 5000 || avgWordsPerSentence > 15) {
          readingLevel = 'Intermediate';
        }

        const stats: DocumentStats = {
          wordCount,
          characterCount,
          readingTime,
          readingLevel
        };

        onStatsUpdate(stats);

        onProgressUpdate({
          percentage: 0,
          timeRead: 0,
          timeRemaining: readingTime,
          currentPosition: 0,
          totalLength: characterCount
        });

        console.log('Document stats updated:', stats);
      }

    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Text extraction failed",
        description: "Could not extract text for analysis",
        variant: "destructive",
      });
    }
  }, [onContentExtracted, onStatsUpdate, onProgressUpdate, toast]);

  // Only re-apply annotations when highlights/notes change, without re-rendering EPUB
  useEffect(() => {
    if (isSetupCompleteRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        applyHighlightsAndNotesToCurrentView();
      }, 100);
    }
  }, [highlights.length, notes.length]); // Only depend on length changes

  // Main effect to load EPUB - ONLY re-render when document changes
  useEffect(() => {
    if (!document || !viewerRef.current) return;

    // Reset setup state
    isSetupCompleteRef.current = false;

    const cleanup = () => {
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying book:', e);
        }
      }
      bookRef.current = null;
      renditionRef.current = null;
    };

    setIsLoading(true);

    const viewer = viewerRef.current;
    viewer.innerHTML = '';

    console.log('Loading EPUB:', document.originalName);

    // Try multiple URL formats for better compatibility
    const epubUrl = `/uploads/${document.filename}`;
    const fallbackUrl = `/api/file/${document.filename}`;

    console.log('Attempting to load EPUB from:', epubUrl);

    // Test if the file is accessible first
    fetch(epubUrl, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          console.warn('Primary URL failed, trying fallback:', fallbackUrl);
          return fetch(fallbackUrl, { method: 'HEAD' });
        }
        return response;
      })
      .then(response => {
        const urlToUse = response.url.includes('/api/file/') ? fallbackUrl : epubUrl;
        console.log('Using URL:', urlToUse);

        const book = ePub(urlToUse);
        bookRef.current = book;

        const rendition = book.renderTo(viewer, {
          width: viewer.clientWidth,
          height: viewer.clientHeight,
          spread: "auto",
          flow: "paginated"
        });
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
              onProgressUpdate({
                percentage: Math.round(progress * 100),
                timeRead: 0,
                timeRemaining: 0,
                currentPosition: Math.round(progress * 100),
                totalLength: 100
              });
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
        console.error('Error loading EPUB:', error);
        setIsLoading(false);
        toast({
          title: "Loading failed",
          description: `Could not load the EPUB file: ${error.message}`,
          variant: "destructive",
        });
      });

    return cleanup;
  }, [document?.filename]); // ONLY depend on document filename change

  // Update font size
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
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground truncate max-w-md">
          {document.originalName}
        </h1>
        <div className="flex items-center space-x-2">
          {/* Editing Tools */}
          <Button
            variant={highlightMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setHighlightMode(!highlightMode);
              setNoteMode(false);
            }}
            className={highlightMode ? "bg-yellow-500 text-white" : ""}
          >
            <Highlighter className="h-4 w-4 mr-1" />
            Highlight
          </Button>

          <Button
            variant={noteMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setNoteMode(!noteMode);
              setHighlightMode(false);
            }}
            className={noteMode ? "bg-blue-500 text-white" : ""}
          >
            <StickyNote className="h-4 w-4 mr-1" />
            Note
          </Button>

          {/* Navigation */}
          <Button variant="ghost" size="sm" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <Button variant="ghost" size="sm" onClick={goNext}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>

          {/* Font size */}
          <div className="flex items-center surface-200 dark:surface-700 rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={() => adjustFontSize(-10)} className="h-8 w-8 p-0">
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium text-foreground min-w-[3rem] text-center">
              {fontSize}%
            </span>
            <Button variant="ghost" size="sm" onClick={() => adjustFontSize(10)} className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-6 py-2 bg-muted/20 border-b border-border">
        <p className="text-xs text-muted-foreground text-center">
          {highlightMode ? "🖍️ Highlight mode: Select text to automatically highlight" :
           noteMode ? "📝 Note mode: Select text to add a note" :
           "💡 Use highlight/note tools above to annotate text • Click 📝 icons to view/edit notes"}
        </p>
      </div>

      {/* EPUB Viewer */}
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

      {/* Enhanced Note Dialog */}
      <NoteDialog
        isOpen={showNoteDialog}
        onClose={() => {
          setShowNoteDialog(false);
          setNoteDialogData(null);
        }}
        onSave={handleNoteSave}
        onDelete={noteDialogData?.isEditing ? handleNoteDelete : undefined}
        selectedText={noteDialogData?.selectedText || ''}
        position={noteDialogData?.position || { x: 0, y: 0 }}
        isEditing={noteDialogData?.isEditing || false}
        initialNoteText={noteDialogData?.existingNote?.noteText || ''}
      />
    </main>
  );
}