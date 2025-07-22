// client/src/hooks/use-bookmarks.ts
import { useState, useCallback, useEffect } from 'react';

export interface Bookmark {
  id: string;
  documentId: string;
  position: number;
  text: string;
  timestamp: string;
  title?: string;
}

export interface BookmarkData {
  bookmarks: Bookmark[];
  lastPosition: number;
}

export function useBookmarks(documentId: string | null) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lastPosition, setLastPosition] = useState(0);

  const getStorageKey = useCallback((docId: string) => `eReader_bookmarks_${docId}`, []);

  // Load bookmarks when document changes
  useEffect(() => {
    if (!documentId) {
      setBookmarks([]);
      setLastPosition(0);
      return;
    }

    const storageKey = getStorageKey(documentId);
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const data: BookmarkData = JSON.parse(stored);
        setBookmarks(data.bookmarks || []);
        setLastPosition(data.lastPosition || 0);
        console.log('Loaded bookmarks for document:', documentId, data);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        setBookmarks([]);
        setLastPosition(0);
      }
    } else {
      setBookmarks([]);
      setLastPosition(0);
    }
  }, [documentId, getStorageKey]);

  // Save bookmarks to localStorage
  const saveBookmarks = useCallback((newBookmarks: Bookmark[], newLastPosition: number) => {
    if (!documentId) return;

    const storageKey = getStorageKey(documentId);
    const data: BookmarkData = {
      bookmarks: newBookmarks,
      lastPosition: newLastPosition
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('Saved bookmarks for document:', documentId);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }, [documentId, getStorageKey]);

  const addBookmark = useCallback((position: number, text: string, title?: string) => {
    if (!documentId) return;

    const newBookmark: Bookmark = {
      id: `bookmark_${Date.now()}`,
      documentId,
      position,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString(),
      title
    };

    const newBookmarksArray = [...bookmarks, newBookmark];
    setBookmarks(newBookmarksArray);
    saveBookmarks(newBookmarksArray, lastPosition);

    return newBookmark;
  }, [bookmarks, documentId, lastPosition, saveBookmarks]);

  const removeBookmark = useCallback((bookmarkId: string) => {
    const newBookmarksArray = bookmarks.filter(b => b.id !== bookmarkId);
    setBookmarks(newBookmarksArray);
    saveBookmarks(newBookmarksArray, lastPosition);
  }, [bookmarks, lastPosition, saveBookmarks]);

  const updateLastPosition = useCallback((position: number) => {
    setLastPosition(position);
    saveBookmarks(bookmarks, position);
  }, [bookmarks, saveBookmarks]);

  const getBookmarkAtPosition = useCallback((position: number, tolerance: number = 50) => {
    return bookmarks.find(bookmark => 
      Math.abs(bookmark.position - position) <= tolerance
    );
  }, [bookmarks]);

  return {
    bookmarks,
    lastPosition,
    addBookmark,
    removeBookmark,
    updateLastPosition,
    getBookmarkAtPosition
  };
}