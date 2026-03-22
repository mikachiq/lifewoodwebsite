alter table public.news_posts
  add column if not exists gallery_image_paths text[] not null default '{}'::text[];
