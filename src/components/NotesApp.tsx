import { useState, useEffect } from 'react';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';
import { AppHeader } from './AppHeader';
import { FolderSidebar, FolderItem } from './FolderSidebar';
import { atprotoClient, ATProtoRecord, ATProtoFolder, ATProtoTag } from '@/lib/atproto';
import { notesStorage, CachedNote } from '@/lib/storage';
import { foldersStorage, tagsStorage, CachedFolder, CachedTag } from '@/lib/folderStorage';
import { useToast } from '@/hooks/use-toast';

export function NotesApp() {
  const [notes, setNotes] = useState<CachedNote[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [tags, setTags] = useState<CachedTag[]>([]);
  const [selectedNote, setSelectedNote] = useState<CachedNote | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      // Load from local cache first
      const cachedNotes = await notesStorage.getAllNotes();
      const cachedFolders = await foldersStorage.getAll();
      const cachedTags = await tagsStorage.getAll();
      setNotes(cachedNotes);
      setFolders(cachedFolders);
      setTags(cachedTags);

      // Sync with PDS
      await syncWithPDS();
    } catch (error) {
      console.error('Failed to load notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const syncWithPDS = async () => {
    try {
      setSyncing(true);
      
      // Sync notes
      const remoteNotes = await atprotoClient.listNotes();
      const cachedNotes: CachedNote[] = remoteNotes.map((record) => {
        const rkey = record.uri.split('/').pop() || '';
        const noteValue = record.value as any; // The value is already typed correctly from listNotes
        return {
          $type: 'app.mbdio.uk.note' as const,
          title: noteValue.title,
          content: noteValue.content,
          tags: noteValue.tags,
          folder: noteValue.folder,
          createdAt: noteValue.createdAt,
          updatedAt: noteValue.updatedAt,
          uri: record.uri,
          cid: record.cid,
          rkey,
          syncStatus: 'synced' as const,
        };
      });

      for (const note of cachedNotes) {
        await notesStorage.saveNote(note);
      }
      setNotes(cachedNotes);

      // Sync folders
      const remoteFolders = await atprotoClient.listFolders();
      const cachedFolders: CachedFolder[] = remoteFolders.map((record: ATProtoRecord<ATProtoFolder>) => {
        const rkey = record.uri.split('/').pop() || '';
        return {
          ...record.value,
          uri: record.uri,
          cid: record.cid,
          rkey,
        };
      });

      for (const folder of cachedFolders) {
        await foldersStorage.save(folder);
      }
      setFolders(cachedFolders);

      // Sync tags
      const remoteTags = await atprotoClient.listTags();
      const cachedTagsList: CachedTag[] = remoteTags.map((record: ATProtoRecord<ATProtoTag>) => {
        const rkey = record.uri.split('/').pop() || '';
        return {
          $type: 'app.mbdio.uk.tag' as const,
          ...record.value,
          uri: record.uri,
          cid: record.cid,
          rkey,
        };
      });

      for (const tag of cachedTagsList) {
        await tagsStorage.save(tag);
      }
      setTags(cachedTagsList);

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const createNote = async () => {
    const now = new Date().toISOString();
    const newNote: CachedNote = {
      $type: 'app.mbdio.uk.note',
      title: 'Untitled Note',
      content: '',
      tags: [],
      folder: selectedFolder || undefined,
      createdAt: now,
      updatedAt: now,
      uri: '',
      cid: '',
      rkey: `temp-${Date.now()}`,
      syncStatus: 'pending',
    };

    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    await notesStorage.saveNote(newNote);

    // Create on PDS
    try {
      const record = await atprotoClient.createNote({
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags,
        folder: newNote.folder,
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
      });

      const rkey = record.uri.split('/').pop() || '';
      const syncedNote: CachedNote = {
        $type: newNote.$type,
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags,
        folder: newNote.folder,
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
        uri: record.uri,
        cid: record.cid,
        rkey,
        syncStatus: 'synced' as const,
      };
      
      await notesStorage.saveNote(syncedNote);
      setNotes(notes.map(n => n.rkey === newNote.rkey ? syncedNote : n));
      setSelectedNote(syncedNote);

      toast({ title: 'Note created', description: 'Your note has been saved to your PDS' });
    } catch (error) {
      toast({ title: 'Sync failed', description: 'Note saved locally, will sync later', variant: 'destructive' });
    }
  };

  const updateNote = async (updatedNote: CachedNote) => {
    const now = new Date().toISOString();
    
    // Create tag records for any new tags
    const tagRkeys: string[] = [];
    for (const tagName of updatedNote.tags) {
      const existingTag = tags.find(t => t.name === tagName);
      if (existingTag) {
        tagRkeys.push(existingTag.rkey);
      } else {
        // Create new tag
        try {
          const record = await atprotoClient.createTag({
            name: tagName,
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            createdAt: now,
          });
          const rkey = record.uri.split('/').pop() || '';
          const newTag: CachedTag = {
            $type: 'app.mbdio.uk.tag' as const,
            name: tagName,
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            createdAt: now,
            uri: record.uri,
            cid: record.cid,
            rkey,
          };
          await tagsStorage.save(newTag);
          setTags([...tags, newTag]);
          tagRkeys.push(rkey);
        } catch (error) {
          console.error('Failed to create tag:', error);
        }
      }
    }
    
    const noteToUpdate = { ...updatedNote, updatedAt: now, syncStatus: 'pending' as const };
    
    setNotes(notes.map(n => n.rkey === noteToUpdate.rkey ? noteToUpdate : n));
    setSelectedNote(noteToUpdate);
    await notesStorage.saveNote(noteToUpdate);

    // Update on PDS
    if (noteToUpdate.rkey && !noteToUpdate.rkey.startsWith('temp-')) {
      try {
        await atprotoClient.updateNote(noteToUpdate.rkey, {
          title: noteToUpdate.title,
          content: noteToUpdate.content,
          tags: tagRkeys,
          folder: noteToUpdate.folder,
          createdAt: noteToUpdate.createdAt,
          updatedAt: noteToUpdate.updatedAt,
        });

        const syncedNote = { ...noteToUpdate, syncStatus: 'synced' as const };
        await notesStorage.saveNote(syncedNote);
        setNotes(notes.map(n => n.rkey === syncedNote.rkey ? syncedNote : n));
        setSelectedNote(syncedNote);
      } catch (error) {
        toast({ title: 'Sync failed', description: 'Changes saved locally, will sync later', variant: 'destructive' });
      }
    }
  };

  const deleteNote = async (rkey: string) => {
    setNotes(notes.filter(n => n.rkey !== rkey));
    if (selectedNote?.rkey === rkey) {
      setSelectedNote(null);
    }
    await notesStorage.deleteNote(rkey);

    if (!rkey.startsWith('temp-')) {
      try {
        await atprotoClient.deleteNote(rkey);
        toast({ title: 'Note deleted', description: 'Note removed from your PDS' });
      } catch (error) {
        toast({ title: 'Delete failed', description: 'Could not delete from PDS', variant: 'destructive' });
      }
    }
  };

  const createFolder = async (name: string, color: string) => {
    try {
      const record = await atprotoClient.createFolder({
        name,
        color,
        createdAt: new Date().toISOString(),
      });

      const rkey = record.uri.split('/').pop() || '';
      const newFolder: FolderItem = {
        uri: record.uri,
        rkey,
        name,
        color,
        createdAt: new Date().toISOString(),
      };

      await foldersStorage.save(newFolder as CachedFolder);
      setFolders([...folders, newFolder]);
      toast({ title: 'Folder created', description: `"${name}" has been created` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create folder', variant: 'destructive' });
    }
  };

  const deleteFolder = async (rkey: string) => {
    try {
      await atprotoClient.deleteFolder(rkey);
      await foldersStorage.delete(rkey);
      setFolders(folders.filter(f => f.rkey !== rkey));
      toast({ title: 'Folder deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete folder', variant: 'destructive' });
    }
  };

  const filteredNotes = selectedFolder
    ? notes.filter(note => note.folder === selectedFolder)
    : notes;

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader onNewNote={createNote} onSync={syncWithPDS} syncing={syncing} />
      <div className="flex-1 flex overflow-hidden">
        <FolderSidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
        />
        <NotesList
          notes={filteredNotes}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          loading={loading}
        />
        <NoteEditor
          note={selectedNote}
          folders={folders}
          onUpdate={updateNote}
          onDelete={deleteNote}
        />
      </div>
    </div>
  );
}
