// client/src/components/reading-assistant.tsx
import { Clock, FileText, BarChart3, Bookmark, Share, Download, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceControls } from './voice-controls';
import { Document, DocumentStats, ReadingProgress } from '@/types/document';
import { useSpeech } from '@/hooks/use-speech';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface ReadingAssistantProps {
  document: Document | null;
  content: string;
  stats: DocumentStats;
  progress: ReadingProgress;
  startFromIndex?: number;
  onNavigateToBookmark?: (position: number) => void;
}

export function ReadingAssistant({ 
  document, 
  content, 
  stats, 
  progress, 
  startFromIndex = 0,
  onNavigateToBookmark
}: ReadingAssistantProps) {
  const textToRead = startFromIndex > 0 && content ? content.substring(startFromIndex) : content;
  
  const speechControls = useSpeech(textToRead);
  const { toast } = useToast();
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks(document?.filename || null);

  // Get real-time progress from speech controls
  const realTimeProgress = speechControls.getReadingProgress();
  
  // Use real-time progress if speech is active, otherwise use document progress
  const currentProgress = speechControls.isPlaying ? {
    ...progress,
    percentage: realTimeProgress.percentage,
    timeRead: realTimeProgress.timeRead,
    timeRemaining: realTimeProgress.timeRemaining
  } : progress;

  const handleActionClick = (featureName: string) => {
    toast({
      title: 'Coming Soon',
      description: `${featureName} functionality is not yet implemented.`,
    });
  };

  const handleBookmarkCurrent = () => {
    if (!content || speechControls.currentPosition === 0) {
      toast({
        title: 'No position to bookmark',
        description: 'Start reading first to bookmark your current position.',
        variant: 'destructive'
      });
      return;
    }

    const bookmarkText = content.substring(speechControls.currentPosition, speechControls.currentPosition + 100);
    addBookmark(speechControls.currentPosition, bookmarkText, 'Reading Position');
    
    toast({
      title: 'Bookmark added',
      description: 'Current reading position has been bookmarked.',
    });
  };

  const handleBookmarkClick = (bookmarkPosition: number) => {
    if (onNavigateToBookmark) {
      onNavigateToBookmark(bookmarkPosition);
    }
    
    // Also trigger speech from this position
    const bookmarkText = content.substring(bookmarkPosition);
    speechControls.speak(bookmarkPosition);
    
    toast({
      title: 'Navigated to bookmark',
      description: 'Starting reading from bookmarked position.',
    });
  };

  const formatReadingTime = (minutes: number) => {
    if (minutes < 0.1) return '< 1 min';
    if (minutes < 1) return `${Math.round(minutes * 60)} sec`;
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <aside className="w-80 surface-100 dark:surface-800 border-l border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Reading Assistant</h2>
        
        <VoiceControls {...speechControls} />
        
        {startFromIndex > 0 && (
          <div className="mt-4 p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              🎯 Reading from clicked position
            </p>
          </div>
        )}
      </div>

      {document && (
        <>
          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Reading Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{Math.round(currentProgress.percentage)}%</span>
              </div>
              <Progress value={currentProgress.percentage} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatReadingTime(currentProgress.timeRead)} read</span>
                <span>{formatReadingTime(currentProgress.timeRemaining)} left</span>
              </div>
              {speechControls.isPlaying && (
                <div className="text-xs text-center text-primary">
                  🔊 Currently reading...
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Document Insights</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatReadingTime(stats.readingTime)}
                  </p>
                  <p className="text-xs text-muted-foreground">Estimated reading time</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {stats.wordCount.toLocaleString()} words
                  </p>
                  <p className="text-xs text-muted-foreground">Word count</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{stats.readingLevel}</p>
                  <p className="text-xs text-muted-foreground">Reading level</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bookmarks Section */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Bookmarks ({bookmarks.length})</h3>
              <Button variant="ghost" size="sm" onClick={handleBookmarkCurrent}>
                <BookmarkPlus className="w-4 h-4" />
              </Button>
            </div>
            
            {bookmarks.length > 0 ? (
              <ScrollArea className="max-h-40">
                <div className="space-y-2">
                  {bookmarks.map((bookmark) => (
                    <div 
                      key={bookmark.id}
                      className="group p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleBookmarkClick(bookmark.position)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground font-medium truncate">
                            {bookmark.text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(bookmark.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBookmark(bookmark.id);
                            toast({
                              title: 'Bookmark removed',
                              description: 'Bookmark has been deleted.',
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        >
                          <Bookmark className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Double-click any text while reading to create bookmarks
              </p>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => handleActionClick('Share Document')}>
                  <Share className="w-4 h-4 mr-3" />
                  Share Document
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => handleActionClick('Export')}>
                  <Download className="w-4 h-4 mr-3" />
                  Export
                </Button>
              </div>
              
              {/* Debug/Status Information */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">
                  Content: {content.length} characters
                </p>
                {startFromIndex > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Reading from: position {startFromIndex}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Current: position {speechControls.currentPosition}
                </p>
              </div>
            </div>
          </ScrollArea>
        </>
      )}
    </aside>
  );
}