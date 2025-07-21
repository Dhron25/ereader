import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useUploadDocument } from '@/hooks/use-documents';
import { useToast } from '@/hooks/use-toast';

export function UploadZone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadDocument, isPending } = useUploadDocument();
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    const allowedType = 'application/epub+zip';

    if (file.type !== allowedType) {
      toast({
        title: "Invalid file type",
        description: "Please upload an EPUB (.epub) file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    uploadDocument(file, {
      onSuccess: () => {
        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded successfully.`,
        });
      },
      onError: (error) => {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
          isDragOver 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary'
        } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="space-y-3">
          <div className="w-12 h-12 primary-100 dark:primary-900 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop EPUB file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              .epub files up to 50MB
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".epub,application/epub+zip"
          onChange={handleFileSelect}
        />
      </div>

      {isPending && (
        <div className="surface-200 dark:surface-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Uploading book...
            </span>
          </div>
          <Progress value={undefined} className="w-full" />
        </div>
      )}
    </div>
  );
}