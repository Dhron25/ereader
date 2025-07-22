// client/src/components/note-dialog.tsx
import React, { useState } from 'react';
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
  position: { x: number; y: number };
}

export function NoteDialog({ isOpen, onClose, onSave, selectedText, position }: NoteDialogProps) {
  const [noteText, setNoteText] = useState('');

  const handleSave = () => {
    if (noteText.trim()) {
      onSave(noteText.trim());
      setNoteText('');
      onClose();
    }
  };

  const handleCancel = () => {
    setNoteText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Selected text:</p>
            <p className="text-sm font-medium">"{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"</p>
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
          <Button variant="outline" onClick={handleCancel}>
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