import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Tag, X, FileText, Eye, Edit } from 'lucide-react';
import { CachedNote } from '@/lib/storage';
import { MarkdownToolbar } from './MarkdownToolbar';
import { MarkdownPreview } from './MarkdownPreview';
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
  onUpdate: (note: CachedNote) => void;
  onDelete: (rkey: string) => void;
}

export function NoteEditor({ note, onUpdate, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
    }
  }, [note]);

  const handleUpdate = () => {
    if (!note) return;
    onUpdate({
      ...note,
      title,
      content,
      tags,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput('');
      if (note) {
        onUpdate({ ...note, title, content, tags: newTags });
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    if (note) {
      onUpdate({ ...note, title, content, tags: newTags });
    }
  };

  const insertMarkdown = (before: string, after?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

    let newContent: string;
    let newCursorPos: number;

    if (after) {
      // Wrap selection
      newContent = beforeText + before + selectedText + after + afterText;
      newCursorPos = start + before.length + selectedText.length + after.length;
    } else {
      // Insert at cursor or beginning of line
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      newContent = content.substring(0, lineStart) + before + content.substring(lineStart);
      newCursorPos = lineStart + before.length;
    }

    setContent(newContent);
    if (note) {
      onUpdate({ ...note, title, content: newContent, tags });
    }

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
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
          <div className="p-6 pb-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Note title"
              className="text-3xl font-serif font-bold border-0 px-0 focus-visible:ring-0"
            />
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'edit' | 'preview')} className="flex-1">
            <div className="border-b border-border/50">
              <TabsList className="ml-6">
                <TabsTrigger value="edit" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="edit" className="mt-0">
              <MarkdownToolbar onInsert={insertMarkdown} />
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleUpdate}
                placeholder="Start writing... Use the toolbar above for formatting."
                className="min-h-[500px] text-base border-0 rounded-none resize-none focus-visible:ring-0 font-serif px-6 py-4"
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-0 p-6">
              <div className="min-h-[500px] max-w-3xl">
                {content ? (
                  <MarkdownPreview content={content} />
                ) : (
                  <p className="text-muted-foreground italic">Nothing to preview yet. Switch to Edit mode to start writing.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

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
