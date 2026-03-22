import React from 'react';
import { useConfirm } from './ConfirmModal';
import { useAuth } from './AuthProvider';
import { useProfile } from '../hooks/useProfile';
import { useToast } from './ToastProvider';
import {
  addComment,
  deleteComment,
  getPublishedNewsPost,
  listAdminRecipients,
  listComments,
  NewsComment,
  NewsPostRecord,
  reactToPost,
  REACTION_OPTIONS,
  removeReaction,
  sendNotification,
  updateComment,
} from '../lib/news';

function extractMediaUrls(post: NewsPostRecord | null) {
  if (!post) return [];
  const normalizeKey = (url: string) => {
    try {
      const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://lifewood.local');
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url.split('?')[0] || url;
    }
  };

  const dedupe = (values: string[]) => {
    const seen = new Set<string>();
    return values.filter(value => {
      if (!value) return false;
      const key = normalizeKey(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const uploadedMedia = dedupe([
    ...(post.gallery_image_urls || []),
    post.cover_image_url || '',
  ]);

  if (uploadedMedia.length > 0) return uploadedMedia;

  if (typeof window !== 'undefined' && post.body) {
    const doc = new DOMParser().parseFromString(post.body, 'text/html');
    return dedupe(
      Array.from(doc.querySelectorAll('img[src]'))
        .map(node => node.getAttribute('src') || '')
        .filter(Boolean),
    );
  }

  return [];
}

function timeAgo(value: string) {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function Avatar({ name, src, size = 8 }: { name: string; src: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full object-cover border border-[#e6decf] shrink-0`;
  if (src) return <img src={src} alt={name} className={cls} />;
  return <div className={`w-${size} h-${size} rounded-full bg-[#163126] text-white flex items-center justify-center font-black text-xs shrink-0`}>{name.slice(0, 1).toUpperCase()}</div>;
}

function PostMediaGallery({ title, mediaUrls }: { title: string; mediaUrls: string[] }) {
  const [currentMediaIndex, setCurrentMediaIndex] = React.useState(0);
  React.useEffect(() => setCurrentMediaIndex(0), [mediaUrls]);
  const activeMediaUrl = mediaUrls[currentMediaIndex] || null;
  const hasGallery = mediaUrls.length > 1;
  if (!activeMediaUrl) return null;
  return (
    <>
      <img src={activeMediaUrl} alt={title} className="news-post-media-image" />
      {hasGallery ? (
        <>
          <button type="button" onClick={() => setCurrentMediaIndex(index => (index - 1 + mediaUrls.length) % mediaUrls.length)} className="absolute left-5 top-5 z-10 px-4 py-2 rounded-full border border-[#254737] bg-[#163126] text-white text-sm font-black shadow-lg hover:bg-[#214535] transition-colors">Prev</button>
          <button type="button" onClick={() => setCurrentMediaIndex(index => (index + 1) % mediaUrls.length)} className="absolute right-5 top-5 z-10 px-4 py-2 rounded-full border border-[#254737] bg-[#163126] text-white text-sm font-black shadow-lg hover:bg-[#214535] transition-colors">Next</button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/65 text-white text-xs font-black tracking-[0.2em] uppercase">{currentMediaIndex + 1} / {mediaUrls.length}</div>
        </>
      ) : null}
    </>
  );
}

function CommentItem({
  comment,
  currentUserId,
  canModerate,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: NewsComment;
  currentUserId: string | null;
  canModerate: boolean;
  onReply: (comment: NewsComment, body: string) => void;
  onEdit: (comment: NewsComment, body: string) => void;
  onDelete: (comment: NewsComment) => void;
}) {
  const [replyOpen, setReplyOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [showReplies, setShowReplies] = React.useState(false);
  const [replyBody, setReplyBody] = React.useState('');
  const [editBody, setEditBody] = React.useState(comment.is_deleted ? '' : comment.body);
  const isOwner = currentUserId === comment.user_id;
  const authorName = comment.author?.username || 'Lifewood User';

  return (
    <div className="space-y-1">
      <div className="flex gap-2.5 group">
        <Avatar name={authorName} src={comment.author?.avatar_src || null} size={8} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] leading-relaxed">
            <span className="font-black text-[#163126]">{authorName} </span>
            {!comment.is_deleted && !editOpen ? <span className="text-[#3a3a3a]">{comment.body}</span> : null}
          </p>
          {editOpen && !comment.is_deleted ? (
            <div className="mt-2 flex gap-2">
              <input value={editBody} onChange={e => setEditBody(e.target.value)} className="flex-1 text-[13px] border-b border-[#d8cfbf] focus:outline-none focus:border-[#1a3a2a] py-1 bg-transparent" />
              <button onClick={() => { onEdit(comment, editBody); setEditOpen(false); }} className="text-[12px] font-black text-[#1a3a2a]">Save</button>
              <button onClick={() => { setEditBody(comment.body); setEditOpen(false); }} className="text-[12px] font-semibold text-[#8a9a8a]">Cancel</button>
            </div>
          ) : null}
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-[#8a9a8a]">{timeAgo(comment.created_at)}</span>
            {!comment.is_deleted ? <button onClick={() => setReplyOpen(v => !v)} className="text-[11px] font-black text-[#8a9a8a] hover:text-[#163126]">Reply</button> : null}
            {isOwner && !comment.is_deleted ? <button onClick={() => setEditOpen(v => !v)} className="text-[11px] font-black text-[#8a9a8a] hover:text-[#163126]">Edit</button> : null}
            {(isOwner || canModerate) && !comment.is_deleted ? <button onClick={() => onDelete(comment)} className="text-[11px] font-black text-red-400 hover:text-red-600">Delete</button> : null}
          </div>
        </div>
      </div>
      {replyOpen ? (
        <div className="ml-10 flex gap-2 items-center border-b border-[#ede5d8] pb-2">
          <input value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder={`Reply to ${authorName}...`} className="flex-1 text-[13px] focus:outline-none bg-transparent placeholder:text-[#aaa]" />
          <button onClick={() => { if (replyBody.trim()) { onReply(comment, replyBody); setReplyBody(''); setReplyOpen(false); setShowReplies(true); } }} className="text-[12px] font-black text-[#1a3a2a] disabled:opacity-40" disabled={!replyBody.trim()}>Reply</button>
        </div>
      ) : null}
      {comment.replies.length > 0 ? (
        <div className="ml-10">
          <button onClick={() => setShowReplies(v => !v)} className="flex items-center gap-1.5 text-[11px] font-black text-[#8a9a8a] hover:text-[#163126]"><span className="w-5 h-px bg-[#c0c8c0]" />{showReplies ? 'Hide replies' : `View ${comment.replies.length} repl${comment.replies.length === 1 ? 'y' : 'ies'}`}</button>
          {showReplies ? <div className="mt-3 space-y-3">{comment.replies.map(reply => <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId} canModerate={canModerate} onReply={onReply} onEdit={onEdit} onDelete={onDelete} />)}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function findCommentById(items: NewsComment[], targetId: string): NewsComment | null {
  for (const item of items) {
    if (item.id === targetId) return item;
    const nested = findCommentById(item.replies, targetId);
    if (nested) return nested;
  }
  return null;
}

export default function NewsPostExperience({ postId, embedded = false }: { postId: string; embedded?: boolean }) {
  const { user } = useAuth();
  const { displayName, isAdmin, avatarSrc } = useProfile();
  const { confirm, modal: confirmModal } = useConfirm();
  const { pushToast } = useToast();
  const [post, setPost] = React.useState<NewsPostRecord | null>(null);
  const [comments, setComments] = React.useState<NewsComment[]>([]);
  const commentsRef = React.useRef<NewsComment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [commentBody, setCommentBody] = React.useState('');
  const [busyReaction, setBusyReaction] = React.useState<string | null>(null);
  const [savingComment, setSavingComment] = React.useState(false);

  React.useEffect(() => { commentsRef.current = comments; }, [comments]);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const [postData, commentsData] = await Promise.all([getPublishedNewsPost(postId), listComments(postId)]);
      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      console.error('[NewsPostExperience] load error', error);
      pushToast({ type: 'error', message: 'Failed to load this post.' });
    } finally {
      setLoading(false);
    }
  }, [postId, pushToast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const notifyAdminsIfNeeded = async (message: string) => {
    const admins = await listAdminRecipients();
    await Promise.all(admins.filter(a => a.id !== user?.id).map(a => sendNotification({ userId: a.id, message, link: `/news/${postId}` })));
  };

  const handleReaction = async (reactionType: typeof REACTION_OPTIONS[number]['key']) => {
    if (!post || busyReaction) return;
    const wasActive = post.current_user_reaction === reactionType;
    setPost(prev => {
      if (!prev) return prev;
      const newSummary = { ...prev.reaction_summary };
      if (wasActive) newSummary[reactionType] = Math.max(0, newSummary[reactionType] - 1);
      else {
        if (prev.current_user_reaction) newSummary[prev.current_user_reaction] = Math.max(0, newSummary[prev.current_user_reaction] - 1);
        newSummary[reactionType] = (newSummary[reactionType] || 0) + 1;
      }
      return { ...prev, current_user_reaction: wasActive ? null : reactionType, reaction_summary: newSummary, reaction_count: Object.values(newSummary).reduce((a, b) => a + b, 0) };
    });
    try {
      setBusyReaction(reactionType);
      if (wasActive) await removeReaction(postId);
      else {
        await reactToPost(postId, reactionType);
        if (!(isAdmin || post.author_id === user?.id)) {
          const actorName = displayName || user?.email?.split('@')[0] || 'Someone';
          const emoji = REACTION_OPTIONS.find(o => o.key === reactionType)?.emoji || reactionType;
          notifyAdminsIfNeeded(`${actorName} reacted ${emoji} to your post: ${post.title}`).catch(() => {});
        }
      }
    } catch {
      await load();
      pushToast({ type: 'error', message: 'Failed to update reaction.' });
    } finally {
      setBusyReaction(null);
    }
  };

  const handleCommentSubmit = async (body: string, parentCommentId?: string | null) => {
    if (!post || !body.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const author = displayName || user?.email?.split('@')[0] || 'Lifewood User';
    const parentComment = parentCommentId ? findCommentById(commentsRef.current, parentCommentId) : null;
    const newComment: NewsComment = { id: tempId, post_id: postId, user_id: user?.id || '', body: body.trim(), parent_comment_id: parentCommentId || null, is_deleted: false, created_at: now, updated_at: now, author: { id: user?.id || '', username: author, avatar_url: null, avatar_src: avatarSrc || null }, replies: [] };
    if (!parentCommentId) {
      setComments(prev => [...prev, newComment]);
      setCommentBody('');
    } else {
      setComments(prev => {
        const addReply = (items: NewsComment[]): NewsComment[] => items.map(item => item.id === parentCommentId ? { ...item, replies: [...item.replies, newComment] } : { ...item, replies: addReply(item.replies) });
        return addReply(prev);
      });
    }
    try {
      setSavingComment(true);
      const newId = await addComment(postId, body, parentCommentId || null);
      setComments(prev => {
        const replaceTemp = (items: NewsComment[]): NewsComment[] => items.map(item => item.id === tempId ? { ...item, id: newId } : { ...item, replies: replaceTemp(item.replies) });
        return replaceTemp(prev);
      });
      const actorName = displayName || user?.email?.split('@')[0] || 'Someone';
      if (!(isAdmin || post.author_id === user?.id)) notifyAdminsIfNeeded(`${actorName} commented on your post: ${post.title}`).catch(() => {});
      if (parentComment && parentComment.user_id && parentComment.user_id !== user?.id) {
        try {
          await sendNotification({
            userId: parentComment.user_id,
            message: `${actorName} replied to your comment on ${post.title}`,
            link: `/news/${postId}`,
          });
        } catch (error) {
          console.error('[NewsPostExperience] reply notification failed', error);
        }
      }
    } catch {
      setComments(prev => {
        const removeTemp = (items: NewsComment[]): NewsComment[] => items.filter(item => item.id !== tempId).map(item => ({ ...item, replies: removeTemp(item.replies) }));
        return removeTemp(prev);
      });
      if (!parentCommentId) setCommentBody(body);
      pushToast({ type: 'error', message: 'Failed to post comment.' });
    } finally {
      setSavingComment(false);
    }
  };

  const handleEditComment = async (comment: NewsComment, body: string) => {
    setComments(prev => {
      const update = (items: NewsComment[]): NewsComment[] => items.map(item => item.id === comment.id ? { ...item, body } : { ...item, replies: update(item.replies) });
      return update(prev);
    });
    try {
      await updateComment(comment.id, body);
      pushToast({ type: 'success', message: 'Comment updated.' });
    } catch {
      setComments(prev => {
        const revert = (items: NewsComment[]): NewsComment[] => items.map(item => item.id === comment.id ? { ...item, body: comment.body } : { ...item, replies: revert(item.replies) });
        return revert(prev);
      });
      pushToast({ type: 'error', message: 'Failed to update comment.' });
    }
  };

  const handleDeleteComment = async (comment: NewsComment) => {
    if (!await confirm('Remove this comment? This cannot be undone.', { confirmLabel: 'Remove', danger: true })) return;
    setComments(prev => {
      const removeComment = (items: NewsComment[]): NewsComment[] =>
        items
          .filter(item => item.id !== comment.id)
          .map(item => ({ ...item, replies: removeComment(item.replies) }));
      return removeComment(prev);
    });
    try {
      await deleteComment(comment.id);
      pushToast({ type: 'success', message: 'Comment removed.' });
    } catch {
      setComments(prev => {
        if (!comment.parent_comment_id) {
          return [...prev, comment].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }

        const restoreReply = (items: NewsComment[]): NewsComment[] =>
          items.map(item => item.id === comment.parent_comment_id
            ? {
                ...item,
                replies: [...item.replies, comment].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
              }
            : { ...item, replies: restoreReply(item.replies) });

        return restoreReply(prev);
      });
      pushToast({ type: 'error', message: 'Failed to remove comment.' });
    }
  };

  if (loading) return <div className="py-12 text-center text-green-2 dark:text-green-4 font-bold">Loading post...</div>;
  if (!post) return <div className="py-12 text-center text-green-2 dark:text-green-4 font-bold">Post not found.</div>;

  const authorName = post.author?.username || 'Lifewood Team';
  const mediaUrls = extractMediaUrls(post);

  const shellClass = embedded
    ? 'instagram-post-modal'
    : 'news-post-card rounded-[24px] bg-white border border-[#dbdbdb]';

  return (
    <>
      <div className={embedded ? '' : 'pt-[72px] min-h-screen bg-[#fafafa]'}>
        <div className={embedded ? '' : 'max-w-[1240px] mx-auto px-4 py-8'}>
          <div className={shellClass}>
            <div className="instagram-post-media news-post-media">
              {mediaUrls.length > 0 ? <PostMediaGallery title={post.title} mediaUrls={mediaUrls} /> : <div className="news-post-media-fallback bg-[radial-gradient(circle_at_top_left,#ffcf7d_0%,#f0ebe0_40%,#dceee2_100%)] flex flex-col items-center justify-center p-10 text-center"><p className="font-black text-2xl text-[#163126] leading-tight">{post.title}</p><p className="text-sm text-[#567263] mt-3 font-semibold">{formatDate(post.published_at || post.created_at)}</p></div>}
                </div>

            <div className={`instagram-post-panel news-post-panel ${embedded ? 'news-post-panel-embedded' : ''}`}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#dbdbdb] shrink-0">
                <Avatar name={authorName} src={post.author?.avatar_src || null} size={9} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[13px] text-[#163126] truncate">{authorName}</p>
                  <p className="text-[11px] text-[#8a9a8a]">{formatDate(post.published_at || post.created_at)}</p>
                </div>
              </div>

              <div className="px-4 py-3 border-b border-[#efefef] shrink-0">
                <div className="flex gap-2.5">
                  <Avatar name={authorName} src={post.author?.avatar_src || null} size={8} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-[#163126]">{authorName}</p>
                    <p className="mt-0.5 text-[13px] font-semibold leading-relaxed text-[#2f473a]">{post.title}</p>
                    {post.body ? <div className="mt-1.5 text-[12px] text-[#567263] leading-relaxed news-content-compact" dangerouslySetInnerHTML={{ __html: post.body }} /> : null}
                    <p className="text-[11px] text-[#8a9a8a] mt-1">{timeAgo(post.published_at || post.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="instagram-post-comments news-post-panel-scroll px-4 py-3 space-y-4">
                {comments.length === 0 ? <p className="text-[13px] text-[#8a9a8a] text-center py-6">No comments yet. Be the first!</p> : comments.map(comment => <CommentItem key={comment.id} comment={comment} currentUserId={user?.id || null} canModerate={isAdmin} onReply={(target, body) => handleCommentSubmit(body, target.id)} onEdit={handleEditComment} onDelete={handleDeleteComment} />)}
              </div>

              <div className="instagram-post-footer px-4 py-3 border-t border-[#dbdbdb] shrink-0">
                <div className="instagram-reaction-bar flex items-center gap-1 flex-wrap">
                  {REACTION_OPTIONS.map(option => {
                    const isActive = post.current_user_reaction === option.key;
                    const count = post.reaction_summary[option.key];
                    return <button key={option.key} type="button" disabled={!!busyReaction} onClick={() => void handleReaction(option.key)} title={option.label} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[13px] transition-all ${isActive ? `${option.activeClass} border` : 'hover:bg-[#f5f5f5] text-[#3a3a3a]'}`}><span>{option.emoji}</span>{count > 0 ? <span className="text-[11px] font-black">{count}</span> : null}</button>;
                  })}
                </div>
                {post.reaction_count > 0 ? <p className="text-[12px] font-black text-[#163126] mt-1">{post.reaction_count} reaction{post.reaction_count !== 1 ? 's' : ''}</p> : null}
                <div className="instagram-comment-input-row flex items-center gap-3 mt-2">
                  <input value={commentBody} onChange={e => setCommentBody(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && commentBody.trim()) { e.preventDefault(); void handleCommentSubmit(commentBody); } }} placeholder="Add a comment..." className="flex-1 text-[13px] focus:outline-none bg-transparent placeholder:text-[#aaa] text-[#163126]" />
                  {commentBody.trim() ? <button type="button" disabled={savingComment} onClick={() => void handleCommentSubmit(commentBody)} className="text-[13px] font-black text-[#1a3a2a] hover:opacity-70 transition-opacity disabled:opacity-40">{savingComment ? '...' : 'Post'}</button> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {confirmModal}
    </>
  );
}
