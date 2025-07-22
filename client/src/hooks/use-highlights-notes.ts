// client/src/hooks/use-highlights-notes.ts
import { useState, useCallback, useEffect } from 'react';

export interface Highlight {
  id: string;
  documentId: string;
  text: string;
  position: number;
  timestamp: string;
  color: string;
}

export interface Note {
  id: string;
  documentId: string;
  selectedText: string;
  noteText: string;
  position: number;
  timestamp: string;
}

export interface HighlightsNotesData {
  highlights: Highlight[];
  notes: Note[];
}

export function useHighlightsNotes(documentId: string | null) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const getStorageKey = useCallback((docId: string, type: 'highlights' | 'notes') => 
    `eReader_${type}_${docId}`, []);

  // Load highlights and notes when document changes
  useEffect(() => {
    if (!documentId) {
      setHighlights([]);
      setNotes([]);
      return;
    }

    const highlightsKey = getStorageKey(documentId, 'highlights');
    const notesKey = getStorageKey(documentId, 'notes');
    
    const storedHighlights = localStorage.getItem(highlightsKey);
    const storedNotes = localStorage.getItem(notesKey);
    
    if (storedHighlights) {
      try {
        setHighlights(JSON.parse(storedHighlights));
      } catch (error) {
        console.error('Error loading highlights:', error);
        setHighlights([]);
      }
    } else {
      setHighlights([]);
    }

    if (storedNotes) {
      try {
        setNotes(JSON.parse(storedNotes));
      } catch (error) {
        console.error('Error loading notes:', error);
        setNotes([]);
      }
    } else {
      setNotes([]);
    }
  }, [documentId, getStorageKey]);

  // Save to localStorage
  const saveToStorage = useCallback((newHighlights: Highlight[], newNotes: Note[]) => {
    if (!documentId) return;

    const highlightsKey = getStorageKey(documentId, 'highlights');
    const notesKey = getStorageKey(documentId, 'notes');

    try {
      localStorage.setItem(highlightsKey, JSON.stringify(newHighlights));
      localStorage.setItem(notesKey, JSON.stringify(newNotes));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }, [documentId, getStorageKey]);

  const addHighlight = useCallback((text: string, position: number, color: string = '#ffeb3b') => {
    if (!documentId) return null;

    const newHighlight: Highlight = {
      id: `highlight_${Date.now()}_${Math.random()}`,
      documentId,
      text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      position,
      timestamp: new Date().toISOString(),
      color
    };

    const newHighlights = [...highlights, newHighlight];
    setHighlights(newHighlights);
    saveToStorage(newHighlights, notes);

    return newHighlight;
  }, [documentId, highlights, notes, saveToStorage]);

  const addNote = useCallback((selectedText: string, noteText: string, position: number) => {
    if (!documentId) return null;

    const newNote: Note = {
      id: `note_${Date.now()}_${Math.random()}`,
      documentId,
      selectedText: selectedText.substring(0, 100) + (selectedText.length > 100 ? '...' : ''),
      noteText,
      position,
      timestamp: new Date().toISOString()
    };

    const newNotes = [...notes, newNote];
    setNotes(newNotes);
    saveToStorage(highlights, newNotes);

    return newNote;
  }, [documentId, notes, highlights, saveToStorage]);

  const removeHighlight = useCallback((highlightId: string) => {
    const newHighlights = highlights.filter(h => h.id !== highlightId);
    setHighlights(newHighlights);
    saveToStorage(newHighlights, notes);
  }, [highlights, notes, saveToStorage]);

  const removeNote = useCallback((noteId: string) => {
    const newNotes = notes.filter(n => n.id !== noteId);
    setNotes(newNotes);
    saveToStorage(highlights, newNotes);
  }, [notes, highlights, saveToStorage]);

  return {
    highlights,
    notes,
    addHighlight,
    addNote,
    removeHighlight,
    removeNote
  };
}