import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../components/admin/AdminShell';
import { useToast } from '../components/ToastProvider';
import { useConfirm } from '../components/ConfirmModal';
import {
  deleteNewsPost,
  listAdminNewsPosts,
  NewsPostRecord,
  notifyAllUsersAboutPost,
  setNewsPostStatus,
} from '../lib/news';

let cachedAdminPosts: NewsPostRecord[] | null = null;

function formatDate(value: string | null) {
  if (!value) return 'Not published';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: NewsPostRecord['status'] }) {
  const className =
    status === 'published'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : status === 'archived'
        ? 'bg-slate-200 text-slate-700 border-slate-300'
        : 'bg-amber-100 text-amber-800 border-amber-200';

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${className}`}>
      {status}
    </span>
  );
}

export default function AdminPostsPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { confirm, modal: confirmModal } = useConfirm();
  const [posts, setPosts] = React.useState<NewsPostRecord[]>(cachedAdminPosts || []);
  const [loading, setLoading] = React.useState(!cachedAdminPosts);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const loadPosts = React.useCallback(async () => {
    try {
      setLoading(!cachedAdminPosts);
      const data = await listAdminNewsPosts();
      cachedAdminPosts = data;
      setPosts(data);
    } catch (error) {
      console.error('[AdminPostsPage] load error', error);
      pushToast({ type: 'error', message: 'Failed to load posts.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  React.useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleDelete = async (post: NewsPostRecord) => {
    if (!await confirm(`Delete "${post.title}"? This cannot be undone.`, { confirmLabel: 'Delete', danger: true })) return;
    try {
      setBusyId(post.id);
      await deleteNewsPost(post.id);
      setPosts(current => {
        const next = current.filter(item => item.id !== post.id);
        cachedAdminPosts = next;
        return next;
      });
      pushToast({ type: 'success', message: 'Post deleted.' });
    } catch {
      pushToast({ type: 'error', message: 'Failed to delete post.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePublish = async (post: NewsPostRecord) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      setBusyId(post.id);
      await setNewsPostStatus(post.id, nextStatus, post.status);
      if (nextStatus === 'published' && post.status !== 'published') {
        await notifyAllUsersAboutPost(post.id, post.title);
      }
      await loadPosts();
      pushToast({ type: 'success', message: nextStatus === 'published' ? 'Post published.' : 'Post moved to draft.' });
    } catch {
      pushToast({ type: 'error', message: 'Failed to update post status.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleArchive = async (post: NewsPostRecord) => {
    try {
      setBusyId(post.id);
      await setNewsPostStatus(post.id, 'archived', post.status);
      await loadPosts();
      pushToast({ type: 'success', message: 'Post archived.' });
    } catch {
      pushToast({ type: 'error', message: 'Failed to archive post.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <AdminShell
        title="Posts"
        subtitle="Create, publish, and manage company news updates."
        actions={
          <button
            type="button"
            onClick={() => navigate('/admin/posts/create')}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#1a3a2a] text-white font-black text-sm rounded-xl hover:bg-[#29513a] transition-colors shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            New Post
          </button>
        }
      >
        <div className="bg-white rounded-2xl border border-[#e8e3da] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f0ebe2] flex items-center justify-between">
          <h2 className="font-black text-[#1a2e1a] text-base">Company News Posts</h2>
          <span className="text-xs font-bold text-[#8a9a8a] bg-[#f2ece0] px-3 py-1 rounded-full">
            {loading ? '...' : `${posts.length} total`}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#1a3a2a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#8a9a8a] font-medium">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-bold text-[#6a8a7a]">No posts yet</p>
            <p className="text-xs text-[#8a9a8a] mt-1">Create your first company news update to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-[#f0ebe2]">
                  <th className="text-left px-6 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Thumbnail</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Title</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id} className="border-b border-[#f7f4ef] last:border-0 hover:bg-[#faf8f4] transition-colors align-top">
                    <td className="px-6 py-4">
                      {post.cover_image_url ? (
                        <img src={post.cover_image_url} alt={post.title} className="w-20 h-14 rounded-xl object-cover border border-[#e8e3da]" />
                      ) : (
                        <div className="w-20 h-14 rounded-xl border border-dashed border-[#d3c9bb] bg-[#faf7f1] flex items-center justify-center text-[10px] font-bold text-[#8a9a8a] uppercase tracking-widest">
                          No Cover
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[300px]">
                        <p className="font-black text-sm text-[#1a2e1a]">{post.title}</p>
                        <p className="text-xs text-[#7a8d7f] mt-1 line-clamp-2">{post.excerpt || 'No excerpt yet.'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#6a8a7a] font-medium whitespace-nowrap">
                      {formatDate(post.published_at || post.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid grid-cols-[max-content_110px_92px_max-content] gap-2 items-start">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/posts/${post.id}/edit`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3a2a] text-white text-[11px] font-black hover:bg-[#29513a] transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busyId === post.id}
                          onClick={() => void handleTogglePublish(post)}
                          className="inline-flex w-[110px] justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d7cfbf] text-[#1a3a2a] text-[11px] font-black hover:bg-[#f2ece0] transition-colors disabled:opacity-60"
                        >
                          {post.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        {post.status !== 'archived' && (
                          <button
                            type="button"
                            disabled={busyId === post.id}
                            onClick={() => void handleArchive(post)}
                            className="inline-flex w-[92px] justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d7cfbf] text-[#6e5e39] text-[11px] font-black hover:bg-[#f7f0d8] transition-colors disabled:opacity-60"
                          >
                            Archive
                          </button>
                        )}
                        {post.status === 'archived' && <span className="w-[92px]" aria-hidden="true" />}
                        <button
                          type="button"
                          disabled={busyId === post.id}
                          onClick={() => void handleDelete(post)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-[11px] font-black hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </AdminShell>
      {confirmModal}
    </>
  );
}
