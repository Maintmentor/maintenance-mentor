import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Loader2, ThumbsUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  comment: string;
  user_id: string;
  created_at: string;
  likes: number;
  profiles?: { full_name: string; avatar_url?: string };
}

interface VideoCommentsProps {
  videoId: string;
}

export const VideoComments: React.FC<VideoCommentsProps> = ({ videoId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('video_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('video_id', videoId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (!error && data) setComments(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'Please sign in to comment', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          comment: newComment
        });

      if (error) throw error;

      setNewComment('');
      loadComments();
      toast({ title: 'Success', description: 'Comment posted!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Comments ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
          rows={3}
        />
        <Button type="submit" disabled={submitting || !newComment.trim()}>
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" /> Post Comment</>
          )}
        </Button>
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">
                    {comment.profiles?.full_name || 'Anonymous User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                </div>
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
                  <ThumbsUp className="w-4 h-4" />
                  {comment.likes > 0 && <span>{comment.likes}</span>}
                </button>
              </div>
              <p className="text-gray-700">{comment.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};