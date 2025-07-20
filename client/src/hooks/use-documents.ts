import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Document } from '@/types/document';

export function useDocuments() {
  return useQuery<{ success: boolean; files: Document[] }>({
    queryKey: ['/api/files'],
  });
}

export function useDocument(filename: string) {
  return useQuery<{ success: boolean; content: string }>({
    queryKey: ['/api/read', filename],
    enabled: !!filename,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (filename: string) => {
      return apiRequest('DELETE', `/api/delete/${filename}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
  });
}
