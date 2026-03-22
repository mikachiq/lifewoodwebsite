import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listPublishedNewsPosts } from '../lib/news';

function formatDate(value: string | null) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function NewsFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const page = Math.max(1, Number(searchParams.get('page') || '1'));

  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<Awaited<ReturnType<typeof listPublishedNewsPosts>>['posts']>([]);
  const [totalPages, setTotalPages] = React.useState(1);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await listPublishedNewsPosts(page, 6);
        setPosts(result.posts);
        setTotalPages(result.totalPages);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [page]);

  return (
    <div className="pt-28 pb-20 px-4 md:px-6 bg-[linear-gradient(180deg,#fbf8f1_0%,#f5efe2_100%)] min-h-screen">
      <div className="max-w-[1240px] mx-auto">
        <div className="mb-10">
          <span className="inline-flex px-3 py-1 rounded-full bg-[#fff1cf] text-[#9a6b00] text-xs font-black uppercase tracking-[0.24em]">
            Company News
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-[#163126]">Latest updates from Lifewood</h1>
          <p className="mt-4 max-w-2xl text-[#567263] font-semibold leading-relaxed">
            Follow product announcements, milestones, and company-wide updates in one place.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-9 h-9 border-2 border-[#1a3a2a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#789081] font-semibold">Loading news feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white/85 rounded-[32px] border border-[#e6decf] shadow-sm p-12 text-center">
            <p className="text-lg font-black text-[#163126]">No published posts yet</p>
            <p className="text-sm text-[#789081] mt-2">Check back soon for the latest Lifewood updates.</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {posts.map(post => (
                <article
                  key={post.id}
                  onClick={() => navigate(`/news/${post.id}`)}
                  className="news-post-card group cursor-pointer overflow-hidden rounded-[30px] border border-[#e6decf] bg-white shadow-[0_18px_50px_rgba(20,49,38,0.08)] hover:-translate-y-1 transition-all"
                >
                  <div className="news-post-media">
                    {post.cover_image_url ? (
                      <img src={post.cover_image_url} alt={post.title} className="news-post-media-image" />
                    ) : (
                      <div className="news-post-media-fallback bg-[radial-gradient(circle_at_top_left,#ffcf7d_0%,#f6f0e3_35%,#dceee2_100%)]" />
                    )}
                  </div>

                  <div className="news-post-panel">
                    <div className="shrink-0 p-6 border-b border-[#f1ebdf]">
                      <div className="flex items-center gap-3 text-xs font-bold text-[#8b9d92] uppercase tracking-[0.24em]">
                        <span>{formatDate(post.published_at || post.created_at)}</span>
                        <span className="w-1 h-1 rounded-full bg-[#b9c3b8]" />
                        <span>{post.reaction_count} reactions</span>
                        <span className="w-1 h-1 rounded-full bg-[#b9c3b8]" />
                        <span>{post.comment_count} comments</span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-[#163126] leading-tight group-hover:text-[#1f5a3d] transition-colors">
                        {post.title}
                      </h2>
                    </div>

                    <div className="news-post-panel-scroll px-6 py-5">
                      <p className="text-sm leading-7 text-[#5b7467]">{post.excerpt}</p>
                    </div>

                    <div className="shrink-0 p-6 border-t border-[#f1ebdf]">
                      <div className="flex items-center gap-3">
                        {post.author?.avatar_src ? (
                          <img src={post.author.avatar_src} alt={post.author.username || 'Author'} className="w-11 h-11 rounded-2xl object-cover border border-[#e6decf]" />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-[#163126] text-white flex items-center justify-center font-black">
                            {(post.author?.username || 'L').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-black text-[#163126]">{post.author?.username || 'Lifewood Team'}</p>
                          <p className="text-xs text-[#7c9084] font-semibold">Author</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setSearchParams(page - 1 <= 1 ? {} : { page: String(page - 1) })}
                className="px-4 py-2.5 rounded-full border border-[#d8cfbf] text-[#1a3a2a] font-black text-sm disabled:opacity-40 hover:bg-white transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-black text-[#5d7367]">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setSearchParams({ page: String(page + 1) })}
                className="px-4 py-2.5 rounded-full border border-[#d8cfbf] text-[#1a3a2a] font-black text-sm disabled:opacity-40 hover:bg-white transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
