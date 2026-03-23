import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import AdminShell from '../components/admin/AdminShell';
import RichTextEditor from '../components/RichTextEditor';
import { useToast } from '../components/ToastProvider';
import {
  createNewsPost,
  getAdminNewsPost,
  NewsPostStatus,
  updateNewsPost,
  uploadNewsCover,
} from '../lib/news';

type UploadedImage = {
  path: string;
  url: string | null;
};

export default function AdminPostEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pushToast } = useToast();

  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('<p></p>');
  const [coverPath, setCoverPath] = React.useState<string | null>(null);
  const [galleryImages, setGalleryImages] = React.useState<UploadedImage[]>([]);
  const [loading, setLoading] = React.useState(isEditing);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [previousStatus, setPreviousStatus] = React.useState<NewsPostStatus>('draft');

  React.useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const post = await getAdminNewsPost(id);
        setTitle(post.title);
        setBody(post.body || '<p></p>');
        setPreviousStatus(post.status);
        setCoverPath(post.cover_image_path);
        setGalleryImages(
          (post.gallery_image_paths.length ? post.gallery_image_paths : (post.cover_image_path ? [post.cover_image_path] : []))
            .map((path, index) => ({
              path,
              url: post.gallery_image_urls[index] || (path === post.cover_image_path ? post.cover_image_url : null),
            })),
        );
      } catch (error) {
        console.error('[AdminPostEditorPage] load error', error);
        pushToast({ type: 'error', message: 'Failed to load post.' });
        navigate('/admin/posts', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, navigate, pushToast]);

  const handleImageUpload = async (files: FileList | File[]) => {
    if (!user) return;
    try {
      setUploading(true);
      const uploaded = await Promise.all(Array.from(files).map(file => uploadNewsCover(file, user.id)));
      setGalleryImages(prev => {
        const next = [...prev, ...uploaded];
        setCoverPath(next[0]?.path || null);
        return next;
      });
      pushToast({ type: 'success', message: uploaded.length > 1 ? 'Images uploaded.' : 'Image uploaded.' });
    } catch {
      pushToast({ type: 'error', message: 'Failed to upload image.' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (path: string) => {
    setGalleryImages(prev => {
      const next = prev.filter(image => image.path !== path);
      setCoverPath(next[0]?.path || null);
      return next;
    });
  };

  const save = async (targetStatus: NewsPostStatus) => {
    if (!title.trim()) {
      pushToast({ type: 'error', message: 'Title is required.' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        body,
        cover_image_path: galleryImages[0]?.path || coverPath,
        gallery_image_paths: galleryImages.map(image => image.path),
        status: targetStatus,
      };

      const post = isEditing && id
        ? await updateNewsPost(id, payload, previousStatus)
        : await createNewsPost(payload);

      pushToast({
        type: 'success',
        message: targetStatus === 'published'
          ? 'Post published.'
          : 'Draft saved.',
      });
      navigate('/admin/posts', { replace: true });
    } catch (error) {
      console.error('[AdminPostEditorPage] save error', error);
      pushToast({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save post.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title={isEditing ? 'Edit Post' : 'Create Post'}
      subtitle="Write a company update and publish it to authenticated users."
      actions={
        <button
          type="button"
          onClick={() => navigate('/admin/posts')}
          className="px-4 py-2.5 rounded-xl border border-[#d8cfbf] text-[#1a3a2a] font-black text-sm hover:bg-[#f2ece0] transition-colors"
        >
          Back to Posts
        </button>
      }
    >
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-[#1a3a2a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#8a9a8a] font-medium">Loading post editor...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.8fr] gap-6">
            <div className="bg-white rounded-2xl border border-[#e8e3da] shadow-sm p-6">
              <label className="block text-[11px] font-black text-[#8a9a8a] uppercase tracking-widest mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Announce a milestone, launch, or update"
                className="w-full rounded-2xl border border-[#dfd7ca] px-4 py-3 text-[#1a2e1a] font-semibold focus:outline-none focus:border-[#1a3a2a]"
              />

              <div className="mt-6">
                <label className="block text-[11px] font-black text-[#8a9a8a] uppercase tracking-widest mb-2">
                  Body
                </label>
                <RichTextEditor value={body} onChange={setBody} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#e8e3da] shadow-sm p-6">
                <label className="block text-[11px] font-black text-[#8a9a8a] uppercase tracking-widest mb-2">
                  Post Images
                </label>
                {galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {galleryImages.map((image, index) => (
                      <div key={image.path} className="relative overflow-hidden rounded-2xl border border-[#e8e3da] bg-[#faf7f1]">
                        {image.url ? (
                          <img src={image.url} alt={`Post image ${index + 1}`} className="h-32 w-full object-cover" />
                        ) : (
                          <div className="flex h-32 items-center justify-center text-xs font-bold uppercase tracking-widest text-[#8a9a8a]">
                            Image {index + 1}
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-[#efe8dc] bg-white px-3 py-2">
                          <span className="text-[11px] font-bold text-[#6a8a7a]">
                            {index === 0 ? 'Cover image' : `Gallery image ${index + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeImage(image.path)}
                            className="text-[11px] font-black text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-52 rounded-2xl border border-dashed border-[#d3c9bb] bg-[#faf7f1] flex items-center justify-center text-xs font-bold text-[#8a9a8a] uppercase tracking-widest mb-4">
                    Upload one or more post images
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={event => {
                    const files = event.target.files;
                    if (!files?.length) return;
                    void handleImageUpload(files);
                    event.currentTarget.value = '';
                  }}
                  className="block w-full text-sm font-semibold text-[#5c6f63] file:mr-4 file:py-2.5 file:px-4 file:rounded-2xl file:border-0 file:bg-[#1a3a2a] file:text-white file:font-black hover:file:opacity-90"
                />
                <p className="mt-3 text-xs text-[#8a9a8a]">
                  The first image is used as the cover on cards. Additional images will appear in the post gallery.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save('draft')}
              className="px-5 py-3 rounded-xl border border-[#d8cfbf] text-[#1a3a2a] font-black text-sm hover:bg-[#f2ece0] transition-colors disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={saving || uploading}
              onClick={() => void save('published')}
              className="px-5 py-3 rounded-xl bg-[#1a3a2a] text-white font-black text-sm hover:bg-[#29513a] transition-colors disabled:opacity-60"
            >
              Publish Now
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
