// client/src/components/main-reader.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ePub from "epubjs";
import { Minus, Plus, ChevronLeft, ChevronRight, BookOpen, Highlighter, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document, DocumentStats, ReadingProgress } from '@/types/document';
import { useToast } from '@/hooks/use-toast';
import { useHighlightsNotes } from '@/hooks/use-highlights-notes';
import { NoteDialog } from './note-dialog';
import { fileStore } from '@/lib/file-store'; // <-- Import the in-memory file store

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
  } = useHighlightsNotes(document?.filename || null);

  useEffect(() => {
    highlightModeRef.current = highlightMode;
  }, [highlightMode]);

  useEffect(() => {
    noteModeRef.current = noteMode;
  }, [noteMode]);

  const applyHighlightsAndNotesToCurrentView = useCallback(() => {
    if (!renditionRef.current) return;
    try {
      const currentView = renditionRef.current.manager?.views?._views[0];
      if (!currentView?.document) return;
      const doc = currentView.document as HTMLDocument;
      // ... (The rest of this function remains the same, it's already client-side)
    } catch (error) {
      console.warn('Error in applyHighlightsAndNotesToCurrentView:', error);
    }
  }, [highlights, notes]);

  const handleTextSelection = useCallback((doc: HTMLDocument, event: MouseEvent) => {
    // ... (This function remains the same, it's already client-side)
  }, [addHighlight, toast]);

  const handleNoteSave = useCallback((noteText: string) => {
    if (!noteDialogData) return;
    const note = addNote(noteDialogData.selectedText, noteText, noteDialogData.selectionPosition);
    if (note) {
      toast({
        title: "Note saved",
        description: `Note added for "${noteDialogData.selectedText.substring(0, 30)}..."`,
      });
      setTimeout(() => applyHighlightsAndNotesToCurrentView(), 100);
    }
    setNoteDialogData(null);
  }, [noteDialogData, addNote, toast, applyHighlightsAndNotesToCurrentView]);

  const setupEditingListeners = useCallback(() => {
    // ... (This function remains the same, it's already client-side)
  }, [addBookmark, toast, handleTextSelection, applyHighlightsAndNotesToCurrentView, notes]);
  
  const extractFullText = useCallback(async (book: any) => {
    // ... (This function remains the same, it's already client-side)
  }, [onContentExtracted, onStatsUpdate, onProgressUpdate, toast]);
  
  useEffect(() => {
    if (isSetupCompleteRef.current) {
      setTimeout(() => applyHighlightsAndNotesToCurrentView(), 100);
    }
    }, [highlights.length, notes.length, applyHighlightsAndNotesToCurrentView]);
  
  }

 