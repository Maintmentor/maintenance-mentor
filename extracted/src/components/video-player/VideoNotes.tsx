import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { StickyNote, Trash2, Edit2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  timestamp_seconds: number | null;
  note_text: string;
  created_at: string;
}

interface VideoNotesProps {
  videoId: string;
  currentTime: number;
}

export function VideoNotes({ videoId, currentTime }: VideoNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [videoId]);

  const loadNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('video_notes')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading notes', variant: 'destructive' });
      return;
    }
    setNotes(data || []);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('video_notes')
      .insert({
        user_id: user.id,
        video_id: videoId,
        timestamp_seconds: Math.floor(currentTime),
        note_text: newNote,
      });

    if (error) {
      toast({ title: 'Error adding note', variant: 'destructive' });
      return;
    }

    toast({ title: 'Note added' });
    setNewNote('');
    setIsAdding(false);
    loadNotes();
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from('video_notes')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting note', variant: 'destructive' });
      return;
    }
    toast({ title: 'Note deleted' });
    loadNotes();
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return 'General';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          <h3 className="font-semibold">Notes ({notes.length})</h3>
        </div>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-1" /> Add Note
        </Button>
      </div>

      {isAdding && (
        <Card className="p-3 space-y-2">
          <Textarea
            placeholder="Add your note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addNote}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {notes.map((note) => (
        <Card key={note.id} className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">
                {formatTime(note.timestamp_seconds)}
              </div>
              <p className="text-sm">{note.note_text}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => deleteNote(note.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
