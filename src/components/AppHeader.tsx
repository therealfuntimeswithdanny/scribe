import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCw, LogOut, User } from 'lucide-react';
import { atprotoClient } from '@/lib/atproto';
import { notesStorage } from '@/lib/storage';

interface AppHeaderProps {
  onNewNote: () => void;
  onSync: () => void;
  syncing: boolean;
}

export function AppHeader({ onNewNote, onSync, syncing }: AppHeaderProps) {
  const credentials = atprotoClient.getCredentials();

  const handleLogout = async () => {
    localStorage.removeItem('atproto-credentials');
    await notesStorage.clear();
    window.location.reload();
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AT Protocol Notes
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{credentials?.handle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button
            size="sm"
            onClick={onNewNote}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Note
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
