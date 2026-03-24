import React from 'react';
import Modal from './Modal';
import { useAuth } from './AuthProvider';
import NewsPostExperience from './NewsPostExperience';
import { listPublishedNewsPosts, type NewsPostRecord } from '../lib/news';

let cachedCompanyNewsPosts: NewsPostRecord[] | null = null;
let cachedCompanyNewsError: string | null = null;

function formatDate(value: string | null) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function CompanyNewsSection() {
  const { user } = useAuth();
  const [posts, setPosts] = React.useState<NewsPostRecord[]>(cachedCompanyNewsPosts || []);
  const [loading, setLoading] = React.useState(!cachedCompanyNewsPosts);
  const [selectedPostId, setSelectedPostId] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(cachedCompanyNewsError);

  React.useEffect(() => {
    let cancelled = false;
    const hasCachedPosts = cachedCompanyNewsPosts && cachedCompanyNewsPosts.length > 0;

    const load = async () => {
      try {
        setLoading(!hasCachedPosts);
        setLoadError(null);
        const result = await listPublishedNewsPosts(1, 6);
        if (!cancelled) {
          cachedCompanyNewsPosts = result.posts;
          cachedCompanyNewsError = null;
          setPosts(result.posts);
        }
      } catch {
        if (!cancelled) {
          setPosts([]);
          const message = user ? 'News is unavailable right now.' : 'Sign in to view company news.';
          cachedCompanyNewsPosts = [];
          cachedCompanyNewsError = message;
          setLoadError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <section id="news-section" className="py-24 md:py-32 px-6 md:px-12 bg-white dark:bg-[#0a1612]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block px-5 py-2 bg-paper dark:bg-green-900/40 text-castleton-green dark:text-saffron font-bold text-xs uppercase tracking-widest rounded-full mb-6">
            Company News
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-dark-serpent dark:text-white mb-8 leading-tight">
            Latest updates from Lifewood
          </h2>
          <p className="text-xl text-green-3 dark:text-green-4 leading-relaxed">
            Follow product announcements, milestones, and company-wide updates in one place.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-green-2 dark:text-green-4 font-bold">Loading company news...</div>
        ) : loadError ? (
          <div className="max-w-2xl mx-auto p-10 text-center bg-paper/30 dark:bg-dark-serpent/40 border border-paper dark:border-green-900/50 rounded-[32px]">
            <p className="text-lg font-black text-dark-serpent dark:text-white">{loadError}</p>
          </div>
        ) : (
          <div className="news-grid-scroll">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedPostId(post.id)}
                className="group flex h-full flex-col text-left p-0 bg-paper/30 dark:bg-dark-serpent/40 border border-paper dark:border-green-900/50 rounded-[32px] hover:bg-white dark:hover:bg-dark-serpent hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-castleton-green to-saffron scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                <div className="h-52 w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffcf7d_0%,#f6f0e3_35%,#dceee2_100%)] shrink-0">
                {post.cover_image_url ? (
                  <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
                </div>
                <div className="flex flex-1 flex-col justify-start p-8 text-center">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-green-2 dark:text-green-4 mb-4">
                    {formatDate(post.published_at || post.created_at)}
                  </p>
                  <h3 className="text-2xl font-black text-dark-serpent dark:text-white line-clamp-3">{post.title}</h3>
                </div>
              </button>
            ))}
          </div>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selectedPostId)}
        title="Company News"
        instagramStyle
        onClose={() => {
          setSelectedPostId(null);
        }}
      >
        {selectedPostId ? <NewsPostExperience postId={selectedPostId} embedded /> : null}
      </Modal>
    </section>
  );
}
