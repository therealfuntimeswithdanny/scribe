import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, Clock } from 'lucide-react';
import { CachedNote } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface NotesListProps {
  notes: CachedNote[];
  selectedNote: CachedNote | null;
  onSelectNote: (note: CachedNote) => void;
  loading: boolean;
}

export function NotesList({ notes, selectedNote, onSelectNote, loading }: NotesListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-80 border-r border-border/50 bg-muted/30 flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            <Clock className="h-6 w-6 mx-auto mb-2 animate-spin" />
            Loading notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
            {searchQuery ? 'No notes found' : 'No notes yet'}
          </div>
        ) : (
          <div className="p-2">
            {filteredNotes.map((note) => (
              <button
                key={note.rkey}
                onClick={() => onSelectNote(note)}
                className={cn(
                  "w-full text-left p-3 rounded-lg mb-2 transition-all hover:bg-card/80",
                  selectedNote?.rkey === note.rkey && "bg-card shadow-sm border border-border/50"
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-sm line-clamp-1">{note.title}</h3>
                  {note.syncStatus !== 'synced' && (
                    <Badge variant="secondary" className="text-xs ml-2">
                      {note.syncStatus}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {note.content || 'Empty note'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.updatedAt)}
                  </span>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
