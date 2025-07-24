// client/src/components/note-dialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit, Save } from 'lucide-react';
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
  onDelete?: () => void;
  selectedText: string;
  position: { x: number; y: number };
  isEditing?: boolean;
  initialNoteText?: string;
}

export function NoteDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  selectedText, 
  position, 
  isEditing = false,
  initialNoteText = ''
}: NoteDialogProps) {
  const [noteText, setNoteText] = useState('');
  const [editMode, setEditMode] = useState(!isEditing);

  useEffect(() => {
    if (isOpen) {
      setNoteText(initialNoteText);
      setEditMode(!isEditing);
    }
  }, [isOpen, initialNoteText, isEditing]);

  const handleSave = () => {
    if (noteText.trim()) {
      onSave(noteText.trim());
      setNoteText('');
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  const handleCancel = () => {
    setNoteText(initialNoteText);
    setEditMode(!isEditing);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <span className="mr-2">📝</span>
              {isEditing ? 'View Note' : 'Add Note'}
            </span>
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Selected text:</p>
            <p className="text-sm font-medium">"{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"</p>
          </div>
          
          <div>
            <label className="text-sm font-medium">Your note:</label>
            {editMode ? (
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                className="mt-2"
                rows={4}
                autoFocus={!isEditing}
              />
            ) : (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg min-h-[100px]">
                <p className="text-sm whitespace-pre-wrap">{noteText || 'No note content'}</p>
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
              💡 Tip: Text with notes will show a 📝 icon. Click the icon to view your note.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {editMode && (
            <Button onClick={handleSave} disabled={!noteText.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Note' : 'Save Note'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}