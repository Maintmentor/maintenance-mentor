import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Bookmark, Trash2, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Bookmark {
  id: string;
  timestamp_seconds: number;
  title: string;
  note: string | null;
}

interface VideoBookmarksProps {
  videoId: string;
  onSeek: (time: number) => void;
}

export function VideoBookmarks({ videoId, onSeek }: VideoBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadBookmarks();
  }, [videoId]);

  const loadBookmarks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('video_bookmarks')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .order('timestamp_seconds', { ascending: true });

    if (error) {
      toast({ title: 'Error loading bookmarks', variant: 'destructive' });
      return;
    }
    setBookmarks(data || []);
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase
      .from('video_bookmarks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting bookmark', variant: 'destructive' });
      return;
    }
    toast({ title: 'Bookmark deleted' });
    loadBookmarks();
  };

  const startEdit = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditTitle(bookmark.title);
    setEditNote(bookmark.note || '');
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('video_bookmarks')
      .update({ title: editTitle, note: editNote })
      .eq('id', editingId);

    if (error) {
      toast({ title: 'Error updating bookmark', variant: 'destructive' });
      return;
    }
    toast({ title: 'Bookmark updated' });
    setEditingId(null);
    loadBookmarks();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Bookmark className="w-5 h-5" />
        <h3 className="font-semibold">Bookmarks ({bookmarks.length})</h3>
      </div>
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="p-3">
          {editingId === bookmark.id ? (
            <div className="space-y-2">
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <Textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}><Check className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => onSeek(bookmark.timestamp_seconds)}>
                  <div className="font-medium text-sm">{bookmark.title}</div>
                  <div className="text-xs text-muted-foreground">{formatTime(bookmark.timestamp_seconds)}</div>
                  {bookmark.note && <p className="text-xs mt-1">{bookmark.note}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(bookmark)}><Edit2 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteBookmark(bookmark.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
