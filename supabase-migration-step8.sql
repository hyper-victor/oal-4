-- STEP 8: Create RLS policies for post_likes
CREATE POLICY IF NOT EXISTS "post_likes select for post family members"
  ON public.post_likes FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_id AND public.is_family_member(p.family_id)
    )
  );

CREATE POLICY IF NOT EXISTS "post_likes insert by post family members"
  ON public.post_likes FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_id AND public.is_family_member(p.family_id)
    ) AND user_id = auth.uid()
  );

CREATE POLICY IF NOT EXISTS "post_likes delete by self"
  ON public.post_likes FOR DELETE USING (user_id = auth.uid());
