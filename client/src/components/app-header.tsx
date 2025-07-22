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
          <div className="flex items-center">
            {/* Logo Text */}
            <div className="flex flex-col">
              <h1 
                className="text-3xl font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent transition-all duration-300 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800"
                style={{ fontFamily: 'cursive' }}
              >
                eReader
              </h1>
              <span className="text-xs text-muted-foreground font-medium tracking-wider opacity-80 hover:opacity-100 transition-opacity duration-300">
                
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