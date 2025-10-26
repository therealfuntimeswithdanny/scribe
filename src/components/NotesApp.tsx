import { useState, useEffect } from 'react';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';
import { AppHeader } from './AppHeader';
import { atprotoClient, ATProtoRecord } from '@/lib/atproto';
import { notesStorage, CachedNote } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export function NotesApp() {
  const [notes, setNotes] = useState<CachedNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<CachedNote | null>(null);
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
      setNotes(cachedNotes);

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
      const remoteNotes = await atprotoClient.listNotes();
      
      const cachedNotes: CachedNote[] = remoteNotes.map((record: ATProtoRecord) => {
        const rkey = record.uri.split('/').pop() || '';
        return {
          ...record.value,
          uri: record.uri,
          cid: record.cid,
          rkey,
          syncStatus: 'synced' as const,
        };
      });

      // Save to local cache
      for (const note of cachedNotes) {
        await notesStorage.saveNote(note);
      }

      setNotes(cachedNotes);
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
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
      });

      const rkey = record.uri.split('/').pop() || '';
      const syncedNote = { ...newNote, ...record.value, uri: record.uri, cid: record.cid, rkey, syncStatus: 'synced' as const };
      
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
          tags: noteToUpdate.tags,
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

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader onNewNote={createNote} onSync={syncWithPDS} syncing={syncing} />
      <div className="flex-1 flex overflow-hidden">
        <NotesList
          notes={notes}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          loading={loading}
        />
        <NoteEditor
          note={selectedNote}
          onUpdate={updateNote}
          onDelete={deleteNote}
        />
      </div>
    </div>
  );
}
