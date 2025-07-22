// client/src/components/document-insights.tsx
import { Clock, FileText, BarChart3, Target } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Document, DocumentStats, ReadingProgress } from '@/types/document';

interface DocumentInsightsProps {
  document: Document | null;
  content: string;
  stats: DocumentStats;
  progress: ReadingProgress;
}

export function DocumentInsights({ 
  document, 
  content, 
  stats, 
  progress
}: DocumentInsightsProps) {
  const formatReadingTime = (minutes: number) => {
    if (minutes < 0.1) return '< 1 min';
    if (minutes < 1) return `${Math.round(minutes * 60)} sec`;
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getReadingLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'text-green-600 dark:text-green-400';
      case 'Intermediate': return 'text-yellow-600 dark:text-yellow-400';
      case 'Advanced': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  if (!document) {
    return (
      <aside className="w-80 surface-100 dark:surface-800 border-l border-border flex flex-col">
        <div className="p-6 text-center">
          <div className="w-16 h-16 surface-200 dark:surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">Document Insights</h3>
          <p className="text-xs text-muted-foreground">Select a document to view insights</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 surface-100 dark:surface-800 border-l border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Document Insights</h2>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 surface-200 dark:surface-700 rounded-lg">
            <div className="text-xl font-bold text-foreground">
              {Math.round(progress.percentage)}%
            </div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
          <div className="text-center p-3 surface-200 dark:surface-700 rounded-lg">
            <div className="text-xl font-bold text-foreground">
              {stats.wordCount ? Math.round(stats.wordCount / 1000) + 'K' : '0'}
            </div>
            <div className="text-xs text-muted-foreground">Words</div>
          </div>
        </div>

        {/* Reading Progress */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Reading Progress</span>
            <span className="font-medium text-foreground">{Math.round(progress.percentage)}%</span>
          </div>
          <Progress value={progress.percentage} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatReadingTime(progress.timeRead)} read</span>
            <span>{formatReadingTime(progress.timeRemaining)} left</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Document Statistics */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatReadingTime(stats.readingTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">Est. reading time</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {stats.wordCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Words</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${getReadingLevelColor(stats.readingLevel)}`}>
                      {stats.readingLevel}
                    </p>
                    <p className="text-xs text-muted-foreground">Reading level</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {stats.characterCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Characters</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}