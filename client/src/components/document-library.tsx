import { FileText, File, BookOpen, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDocuments, useDeleteDocument } from '@/hooks/use-documents';
import { useToast } from '@/hooks/use-toast';
import { UploadZone } from './upload-zone';
import { Document } from '@/types/document';

interface DocumentLibraryProps {
  selectedDocument: Document | null;
  onDocumentSelect: (document: Document) => void;
}

export function DocumentLibrary({ selectedDocument, onDocumentSelect }: DocumentLibraryProps) {
  const { data: documentsData, isLoading } = useDocuments();
  const { mutate: deleteDocument } = useDeleteDocument();
  const { toast } = useToast();

  const documents = documentsData?.files || [];

  const getFileColor = (mimeType: string) => {
    if (mimeType.includes('epub')) return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = (filename: string, originalName: string) => {
    deleteDocument(filename, {
      onSuccess: () => {
        toast({
          title: "Document deleted",
          description: `${originalName} has been deleted.`,
        });
      },
      onError: (error) => {
        toast({
          title: "Delete failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <aside className="w-80 surface-100 dark:surface-800 border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Documents</h2>
        <UploadZone />
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 surface-200 dark:surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">No books yet</h3>
              <p className="text-xs text-muted-foreground">Upload your first EPUB to get started</p>
            </div>
          ) : (
            documents.map((document) => (
              <div
                key={document.filename}
                className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                  selectedDocument?.filename === document.filename
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:border-border hover:bg-muted/50'
                }`}
                onClick={() => onDocumentSelect(document)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileColor(document.mimeType)}`}>
                    <File className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {document.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(document.size)} • {formatDate(document.uploadDate)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(document.filename, document.originalName);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}