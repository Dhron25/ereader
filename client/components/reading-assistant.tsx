import { Clock, FileText, BarChart3, Bookmark, Share, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceControls } from './voice-controls';
import { Document, DocumentStats, ReadingProgress } from '@/types/document';

interface ReadingAssistantProps {
  document: Document | null;
  content: string;
  stats: DocumentStats;
  progress: ReadingProgress;
}

export function ReadingAssistant({ document, content, stats, progress }: ReadingAssistantProps) {
  const formatReadingTime = (minutes: number) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${Math.round(remainingMinutes)}m`;
  };

  return (
    <aside className="w-80 surface-100 dark:surface-800 border-l border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Reading Assistant</h2>
        
        {document && <VoiceControls text={content} />}
      </div>

      {document && (
        <>
          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Reading Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{Math.round(progress.percentage)}%</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatReadingTime(progress.timeRead)}</span>
                <span>{formatReadingTime(progress.timeRemaining)} left</span>
              </div>
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

          <ScrollArea className="flex-1">
            <div className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => console.log('Add bookmark')}
                >
                  <Bookmark className="w-4 h-4 mr-3" />
                  Add Bookmark
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => console.log('Share document')}
                >
                  <Share className="w-4 h-4 mr-3" />
                  Share Document
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => console.log('Export')}
                >
                  <Download className="w-4 h-4 mr-3" />
                  Export
                </Button>
              </div>
            </div>
          </ScrollArea>
        </>
      )}
    </aside>
  );
}
