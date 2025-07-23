// client/src/components/note-dialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface NoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteText: string) => void;
  selectedText: string;
  initialNoteText?: string;
}

export function NoteDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedText, 
  initialNoteText = '' 
}: NoteDialogProps) {
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNoteText(initialNoteText);
    }
  }, [isOpen, initialNoteText]);

  const handleSave = () => {
    if (noteText.trim()) {
      onSave(noteText.trim());
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialNoteText ? 'View / Edit Note' : 'Add Note'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg max-h-28 overflow-y-auto">
            <p className="text-sm text-muted-foreground mb-1">Selected text:</p>
            <blockquote className="text-sm font-medium border-l-2 pl-2 border-border">
              "{selectedText}"
            </blockquote>
          </div>
          
          <div>
            <label className="text-sm font-medium">Your note:</label>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your note here..."
              className="mt-2"
              rows={4}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!noteText.trim()}>
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}