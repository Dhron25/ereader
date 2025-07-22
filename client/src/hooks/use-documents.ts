// client/src/hooks/use-documents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document } from '@/types/document';
import { fileStore } from '@/lib/file-store';

const DOCUMENTS_STORAGE_KEY = 'eReader_documents';

// Helper function to get documents from localStorage
function getStoredDocuments(): Document[] {
  try {
    const stored = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading documents from localStorage:', error);
    return [];
  }
}

// Helper function to save documents to localStorage
function saveStoredDocuments(documents: Document[]) {
  try {
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
  } catch (error) {
    console.error('Error saving documents to localStorage:', error);
  }
}

// Replaces: GET /api/files
export function useDocuments() {
  return useQuery<{ success: boolean; files: Document[] }>({
    queryKey: ['documents'], // Use a non-API key
    queryFn: async () => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      const files = getStoredDocuments();
      return { success: true, files };
    },
    // Keep staleTime if you want to cache, or remove for fresh data on each component mount
    staleTime: 5 * 60 * 1000, 
  });
}

// Replaces: POST /api/upload
export function useUploadDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File): Promise<{ success: boolean; filename: string; originalName: string }> => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const documents = getStoredDocuments();
      const safeOriginalName = file.name.replace(/[^a-z0-9_.\-]/gi, '_').toLowerCase();
      const newFilename = `${Date.now()}-${safeOriginalName}`;

      const newDocument: Document = {
        // We don't have a database ID, so filename is our unique key
        id: documents.length + 1, // Simple incrementing ID for client-side
        filename: newFilename,
        originalName: file.name,
        size: file.size,
        mimeType: file.type || 'application/epub+zip',
        uploadDate: new Date().toISOString(),
      };

      // Add the file to our in-memory store
      fileStore.set(newDocument.filename, file);

      // Add metadata to localStorage
      saveStoredDocuments([...documents, newDocument]);
      
      return { success: true, filename: newDocument.filename, originalName: newDocument.originalName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// Replaces: DELETE /api/delete/:filename
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (filename: string): Promise<{ success: boolean }> => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 300));

      const documents = getStoredDocuments();
      const updatedDocuments = documents.filter(doc => doc.filename !== filename);
      saveStoredDocuments(updatedDocuments);

      // Remove from the in-memory store
      fileStore.delete(filename);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}