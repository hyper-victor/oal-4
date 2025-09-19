-- STEP 2: Create index for post_comments
CREATE INDEX IF NOT EXISTS post_comments_post_created_idx 
ON public.post_comments(post_id, created_at DESC);
