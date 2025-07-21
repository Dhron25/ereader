import { Search, Settings, Moon, Sun, Book, FileText, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-surface-100 dark:bg-surface-800 border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white shadow-lg ring-2 ring-blue-500/20">
              <Book className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent tracking-tight" 
                  style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                eReader
              </h1>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">
                Digital Library
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === 'dark' ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Switch to Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Switch to Dark Mode
                    </>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Reading Preferences
                </DropdownMenuLabel>
                
                <DropdownMenuItem disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Font Settings (Coming Soon)</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem disabled>
                  <Volume2 className="mr-2 h-4 w-4" />
                  <span>Voice Settings (Coming Soon)</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem disabled>
                  <span className="text-xs text-muted-foreground">
                    Export & Backup (Coming Soon)
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
