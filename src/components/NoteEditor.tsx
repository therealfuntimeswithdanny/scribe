import { useState, useEffect, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Link } from '@tiptap/extension-link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Tag, X, FileText, Folder } from 'lucide-react';
import { CachedNote } from '@/lib/storage';
import { FolderItem } from './FolderSidebar';
import { MarkdownToolbar } from './MarkdownToolbar';
import { EditorContent } from '@tiptap/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface NoteEditorProps {
  note: CachedNote | null;
  folders: FolderItem[];
  onUpdate: (note: CachedNote) => void;
  onDelete: (rkey: string) => void;
}

export function NoteEditor({ note, folders, onUpdate, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary-glow cursor-pointer',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] px-6 py-4 font-serif text-base',
      },
    },
  });

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setTags(note.tags || []);
      if (editor && note.content !== editor.getHTML()) {
        editor.commands.setContent(note.content, { emitUpdate: false });
      }
    }
  }, [note, editor]);

  // Debounced sync effect - syncs 4 seconds after user stops typing
  useEffect(() => {
    if (!note || !editor) return;

    // Clear existing timer
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    // Set new timer for 30 seconds
    syncTimerRef.current = setTimeout(() => {
      const html = editor.getHTML();
      onUpdate({
        ...note,
        title,
        content: html,
        tags,
      });
    }, 30000);

    // Cleanup on unmount
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [title, tags, editor?.state.doc, note, onUpdate]);

  const handleManualUpdate = () => {
    if (!note || !editor) return;
    // Clear the debounce timer and sync immediately
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    onUpdate({
      ...note,
      title,
      content: editor.getHTML(),
      tags,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
  };


  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a note or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 pb-2 space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="text-3xl font-serif font-bold border-0 px-0 focus-visible:ring-0"
            />
            
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <Select
                value={note.folder || 'none'}
                onValueChange={(value) => {
                  onUpdate({
                    ...note,
                    folder: value === 'none' ? undefined : value,
                  });
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.rkey} value={folder.rkey}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: folder.color }}
                        />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-b border-border/50">
            <MarkdownToolbar editor={editor} />
          </div>

          <div className="relative">
            <EditorContent editor={editor} />
            {!editor?.getText() && (
              <div className="absolute top-4 left-6 text-muted-foreground pointer-events-none font-serif">
                Start writing... Use the toolbar above for formatting.
              </div>
            )}
          </div>

          <div className="px-6 pb-6 space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag..."
                className="h-8 text-sm"
              />
              <Button onClick={addTag} size="sm" variant="secondary">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 p-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {note.syncStatus === 'synced' ? (
            <span>Synced to PDS</span>
          ) : (
            <span className="text-amber-500">Pending sync...</span>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete note?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{note.title}&quot; from your PDS. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(note.rkey)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
