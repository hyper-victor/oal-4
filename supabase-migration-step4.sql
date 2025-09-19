-- STEP 4: Create index for post_likes
CREATE INDEX IF NOT EXISTS post_likes_post_created_idx 
ON public.post_likes(post_id, created_at DESC);
