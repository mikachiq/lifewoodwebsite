import { getSupabase } from './supabaseClient';

export const REACTION_OPTIONS = [
  { key: 'like', label: 'Like', emoji: '👍', activeClass: 'bg-[#dfefff] text-[#1e5bb8] border-[#a9c8f6]' },
  { key: 'love', label: 'Love', emoji: '❤️', activeClass: 'bg-[#ffe3ea] text-[#c43764] border-[#f8b3c7]' },
  { key: 'celebrate', label: 'Celebrate', emoji: '🎉', activeClass: 'bg-[#fff1d8] text-[#b86b11] border-[#f3cd88]' },
  { key: 'insightful', label: 'Insightful', emoji: '💡', activeClass: 'bg-[#fff5cf] text-[#9a6b00] border-[#f0d36a]' },
  { key: 'funny', label: 'Funny', emoji: '😄', activeClass: 'bg-[#e6fff0] text-[#1d7a48] border-[#9dd7b4]' },
] as const;

export type ReactionType = typeof REACTION_OPTIONS[number]['key'];
export type NewsPostStatus = 'draft' | 'published' | 'archived';

export type AuthorSummary = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  avatar_src: string | null;
};

export type ReactionBreakdown = Record<ReactionType, number>;

export type NewsPostRecord = {
  id: string;
  title: string;
  body: string;
  cover_image_path: string | null;
  cover_image_url: string | null;
  gallery_image_paths: string[];
  gallery_image_urls: string[];
  author_id: string;
  status: NewsPostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: AuthorSummary | null;
  excerpt: string;
  reaction_count: number;
  comment_count: number;
  reaction_summary: ReactionBreakdown;
  current_user_reaction: ReactionType | null;
};

export type NewsComment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  parent_comment_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: AuthorSummary | null;
  replies: NewsComment[];
};

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type PostRow = {
  id: string;
  title: string;
  body: string;
  cover_image_path: string | null;
  gallery_image_paths: string[] | null;
  author_id: string;
  status: NewsPostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: ProfileRow | ProfileRow[] | null;
};

type ReactionRow = {
  post_id: string;
  reaction_type: ReactionType;
  user_id: string;
};

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  parent_comment_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: ProfileRow | ProfileRow[] | null;
};

function emptyReactionSummary(): ReactionBreakdown {
  return {
    like: 0,
    love: 0,
    celebrate: 0,
    insightful: 0,
    funny: 0,
  };
}

function asSingleProfile(value: ProfileRow | ProfileRow[] | null | undefined): ProfileRow | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function stripHtml(html: string) {
  if (typeof window === 'undefined') {
    return normalizeWhitespace(html.replace(/<[^>]*>/g, ' '));
  }
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return normalizeWhitespace(temp.textContent || temp.innerText || '');
}

export function sanitizeRichTextHtml(html: string) {
  if (!html.trim()) return '';
  if (typeof window === 'undefined') {
    return html.replace(/<script[\s\S]*?<\/script>/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,form').forEach(node => node.remove());

  doc.body.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = attr.value.toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

function createExcerpt(body: string) {
  const plain = stripHtml(body);
  if (plain.length <= 180) return plain;
  return `${plain.slice(0, 177).trimEnd()}...`;
}

async function getSignedUrls(bucket: 'avatars' | 'news-covers', paths: string[]) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (!uniquePaths.length) return new Map<string, string>();

  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(uniquePaths, 60 * 60);
  if (error) throw error;

  return new Map(uniquePaths.map((path, index) => [path, data[index]?.signedUrl || '']));
}

async function attachSignedMedia<T extends { cover_image_path?: string | null; gallery_image_paths?: string[] | null; author?: AuthorSummary | null }>(
  posts: T[],
) {
  const coverUrls = await getSignedUrls('news-covers', posts.map(post => post.cover_image_path || '').filter(Boolean));
  const galleryUrls = await getSignedUrls('news-covers', posts.flatMap(post => post.gallery_image_paths || []).filter(Boolean));
  const avatarUrls = await getSignedUrls('avatars', posts.map(post => post.author?.avatar_url || '').filter(Boolean));

  return posts.map(post => ({
    ...post,
    cover_image_url: post.cover_image_path ? (coverUrls.get(post.cover_image_path) || null) : null,
    gallery_image_urls: (post.gallery_image_paths || []).map(path => galleryUrls.get(path) || '').filter(Boolean),
    author: post.author
      ? {
          ...post.author,
          avatar_src: post.author.avatar_url ? (avatarUrls.get(post.author.avatar_url) || null) : null,
        }
      : null,
  }));
}

async function attachCommentMedia(comments: NewsComment[]) {
  const flat: NewsComment[] = [];
  const walk = (items: NewsComment[]) => {
    items.forEach(item => {
      flat.push(item);
      walk(item.replies);
    });
  };
  walk(comments);

  const avatarUrls = await getSignedUrls('avatars', flat.map(comment => comment.author?.avatar_url || '').filter(Boolean));
  const mapComment = (comment: NewsComment): NewsComment => ({
    ...comment,
    author: comment.author
      ? {
          ...comment.author,
          avatar_src: comment.author.avatar_url ? (avatarUrls.get(comment.author.avatar_url) || null) : null,
        }
      : null,
    replies: comment.replies.map(mapComment),
  });

  return comments.map(mapComment);
}

async function getCurrentUserId() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
}

async function getReactionState(postIds: string[]) {
  if (!postIds.length) {
    return {
      summaryByPost: new Map<string, ReactionBreakdown>(),
      currentByPost: new Map<string, ReactionType>(),
    };
  }

  const supabase = getSupabase();
  const currentUserId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('news_reactions')
    .select('post_id, reaction_type, user_id')
    .in('post_id', postIds);

  if (error) throw error;

  const summaryByPost = new Map<string, ReactionBreakdown>();
  const currentByPost = new Map<string, ReactionType>();

  for (const reaction of (data || []) as ReactionRow[]) {
    if (!summaryByPost.has(reaction.post_id)) {
      summaryByPost.set(reaction.post_id, emptyReactionSummary());
    }
    summaryByPost.get(reaction.post_id)![reaction.reaction_type] += 1;
    if (reaction.user_id === currentUserId) {
      currentByPost.set(reaction.post_id, reaction.reaction_type);
    }
  }

  return { summaryByPost, currentByPost };
}

async function getCommentCounts(postIds: string[]) {
  if (!postIds.length) return new Map<string, number>();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('news_comments')
    .select('post_id, is_deleted')
    .in('post_id', postIds);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data || []) {
    if (row.is_deleted) continue;
    counts.set(row.post_id, (counts.get(row.post_id) || 0) + 1);
  }
  return counts;
}

function mapPostRow(row: PostRow): Omit<NewsPostRecord, 'cover_image_url' | 'reaction_count' | 'comment_count' | 'reaction_summary' | 'current_user_reaction'> {
  const author = asSingleProfile(row.author);
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    cover_image_path: row.cover_image_path,
    gallery_image_paths: row.gallery_image_paths || [],
    author_id: row.author_id,
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: author
      ? {
          id: author.id,
          username: author.username,
          avatar_url: author.avatar_url,
          avatar_src: null,
        }
      : null,
    excerpt: createExcerpt(row.body),
  };
}

function mapCommentRow(row: CommentRow): NewsComment {
  const author = asSingleProfile(row.author);
  return {
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    body: row.body,
    parent_comment_id: row.parent_comment_id,
    is_deleted: row.is_deleted,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: author
      ? {
          id: author.id,
          username: author.username,
          avatar_url: author.avatar_url,
          avatar_src: null,
        }
      : null,
    replies: [],
  };
}

async function hydratePosts(postRows: PostRow[]) {
  const posts = postRows.map(mapPostRow);
  const postIds = posts.map(post => post.id);
  const [signedPosts, { summaryByPost, currentByPost }, commentCounts] = await Promise.all([
    attachSignedMedia(posts),
    getReactionState(postIds),
    getCommentCounts(postIds),
  ]);

  return signedPosts.map(post => {
    const summary = summaryByPost.get(post.id) || emptyReactionSummary();
    return {
      ...post,
      reaction_summary: summary,
      reaction_count: Object.values(summary).reduce((sum, value) => sum + value, 0),
      comment_count: commentCounts.get(post.id) || 0,
      current_user_reaction: currentByPost.get(post.id) || null,
    } satisfies NewsPostRecord;
  });
}

export async function listAdminNewsPosts() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('news_posts')
    .select(`
      id,
      title,
      body,
      cover_image_path,
      gallery_image_paths,
      author_id,
      status,
      published_at,
      created_at,
      updated_at,
      author:profiles!news_posts_author_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return hydratePosts((data || []) as PostRow[]);
}

export async function getAdminNewsPost(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('news_posts')
    .select(`
      id,
      title,
      body,
      cover_image_path,
      gallery_image_paths,
      author_id,
      status,
      published_at,
      created_at,
      updated_at,
      author:profiles!news_posts_author_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  const [post] = await hydratePosts([data as PostRow]);
  return post;
}

type UpsertNewsPostInput = {
  title: string;
  body: string;
  cover_image_path?: string | null;
  gallery_image_paths?: string[];
  status: NewsPostStatus;
};

export async function createNewsPost(input: UpsertNewsPostInput) {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('You must be signed in.');

  const { data, error } = await supabase
    .from('news_posts')
    .insert({
      title: input.title.trim(),
      body: sanitizeRichTextHtml(input.body),
      cover_image_path: input.cover_image_path || input.gallery_image_paths?.[0] || null,
      gallery_image_paths: input.gallery_image_paths || [],
      status: input.status,
      author_id: userId,
      published_at: input.status === 'published' ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (error) throw error;
  try {
    return await getAdminNewsPost(data.id);
  } catch {
    const { data: inserted, error: insertedError } = await supabase
      .from('news_posts')
      .select(`
        id,
        title,
        body,
        cover_image_path,
        gallery_image_paths,
        author_id,
        status,
        published_at,
        created_at,
        updated_at,
        author:profiles!news_posts_author_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .eq('id', data.id)
      .single();

    if (insertedError) throw insertedError;
    const [post] = await hydratePosts([inserted as PostRow]);
    return post;
  }
}

export async function updateNewsPost(id: string, input: UpsertNewsPostInput, previousStatus?: NewsPostStatus) {
  const supabase = getSupabase();
  const nextStatus = input.status;
  const { error } = await supabase
    .from('news_posts')
    .update({
      title: input.title.trim(),
      body: sanitizeRichTextHtml(input.body),
      cover_image_path: input.cover_image_path || input.gallery_image_paths?.[0] || null,
      gallery_image_paths: input.gallery_image_paths || [],
      status: nextStatus,
      published_at: nextStatus === 'published' && previousStatus !== 'published'
        ? new Date().toISOString()
        : nextStatus !== 'published'
          ? null
          : undefined,
    })
    .eq('id', id);

  if (error) throw error;
  try {
    return await getAdminNewsPost(id);
  } catch {
    const { data: updated, error: updatedError } = await supabase
      .from('news_posts')
      .select(`
        id,
        title,
        body,
        cover_image_path,
        gallery_image_paths,
        author_id,
        status,
        published_at,
        created_at,
        updated_at,
        author:profiles!news_posts_author_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (updatedError) throw updatedError;
    const [post] = await hydratePosts([updated as PostRow]);
    return post;
  }
}

export async function deleteNewsPost(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('news_posts').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function setNewsPostStatus(id: string, status: NewsPostStatus, previousStatus?: NewsPostStatus) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('news_posts')
    .update({
      status,
      published_at: status === 'published' && previousStatus !== 'published'
        ? new Date().toISOString()
        : status !== 'published'
          ? null
          : undefined,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function uploadNewsCover(file: File, userId: string) {
  const supabase = getSupabase();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from('news-covers').upload(path, file, {
    upsert: false,
    contentType: file.type || 'image/jpeg',
  });
  if (error) throw error;

  const signed = await getSignedUrls('news-covers', [path]);
  return {
    path,
    url: signed.get(path) || null,
  };
}

export async function listPublishedNewsPosts(page = 1, pageSize = 6) {
  const supabase = getSupabase();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('news_posts')
    .select(`
      id,
      title,
      body,
      cover_image_path,
      gallery_image_paths,
      author_id,
      status,
      published_at,
      created_at,
      updated_at,
      author:profiles!news_posts_author_id_fkey (
        id,
        username,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    posts: await hydratePosts((data || []) as PostRow[]),
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  };
}

export async function getPublishedNewsPost(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('news_posts')
    .select(`
      id,
      title,
      body,
      cover_image_path,
      gallery_image_paths,
      author_id,
      status,
      published_at,
      created_at,
      updated_at,
      author:profiles!news_posts_author_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  const [post] = await hydratePosts([data as PostRow]);
  return post;
}

export async function reactToPost(postId: string, reactionType: ReactionType) {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('You must be signed in.');

  const { error } = await supabase
    .from('news_reactions')
    .upsert({
      post_id: postId,
      user_id: userId,
      reaction_type: reactionType,
    }, { onConflict: 'post_id,user_id' });

  if (error) throw error;
}

export async function removeReaction(postId: string) {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('You must be signed in.');

  const { error } = await supabase
    .from('news_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function listComments(postId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('news_comments')
    .select(`
      id,
      post_id,
      user_id,
      body,
      parent_comment_id,
      is_deleted,
      created_at,
      updated_at,
      author:profiles!news_comments_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const mapped = ((data || []) as CommentRow[]).map(mapCommentRow);
  const byId = new Map<string, NewsComment>();
  const roots: NewsComment[] = [];

  mapped.forEach(comment => byId.set(comment.id, comment));
  mapped.forEach(comment => {
    if (comment.parent_comment_id) {
      const parent = byId.get(comment.parent_comment_id);
      if (parent) {
        parent.replies.push(comment);
        return;
      }
    }
    roots.push(comment);
  });

  return attachCommentMedia(roots);
}

export async function addComment(postId: string, body: string, parentCommentId?: string | null) {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('You must be signed in.');

  const { data, error } = await supabase
    .from('news_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      body: body.trim(),
      parent_comment_id: parentCommentId || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateComment(id: string, body: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('news_comments')
    .update({
      body: body.trim(),
      is_deleted: false,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteComment(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('news_comments')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) throw error;
}

export async function listAdminRecipients() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('is_admin', true);

  if (error) throw error;
  return (data || []) as ProfileRow[];
}

export async function sendNotification(input: {
  userId?: string | null;
  userEmail?: string | null;
  message: string;
  link?: string | null;
}) {
  const supabase = getSupabase();
  const { error } = await supabase.from('notifications').insert({
    user_id: input.userId || null,
    user_email: input.userEmail || null,
    message: input.message,
    link: input.link || null,
    read: false,
  });

  if (error) throw error;
}

export async function notifyAllUsersAboutPost(postId: string, postTitle: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('profiles').select('id');
  if (error) throw error;

  const rows = (data || []).filter(profile => profile.id).map(profile => ({
    user_id: profile.id,
    message: `📰 New post: ${postTitle}`,
    link: `/news/${postId}`,
    read: false,
  }));

  if (!rows.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (let index = 0; index < rows.length; index += 100) {
    const chunk = rows.slice(index, index + 100);
    const { error: insertError } = await supabase.from('notifications').insert(chunk);
    if (!insertError) {
      sent += chunk.length;
      continue;
    }

    console.warn('[news] bulk notification insert failed, retrying individually', insertError);
    for (const row of chunk) {
      const { error: rowError } = await supabase.from('notifications').insert(row);
      if (rowError) {
        failed += 1;
        console.warn('[news] notification insert failed for recipient', row.user_id, rowError);
      } else {
        sent += 1;
      }
    }
  }

  if (sent === 0 && rows.length > 0) {
    throw new Error('Failed to send notifications to any recipients.');
  }

  return { sent, failed };
}

export async function getCurrentActorProfile() {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as ProfileRow;
}
