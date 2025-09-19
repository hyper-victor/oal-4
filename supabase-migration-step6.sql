-- STEP 6: Create RLS policies for post_comments
CREATE POLICY IF NOT EXISTS "post_comments select for post family members"
  ON public.post_comments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_id AND public.is_family_member(p.family_id)
    )
  );

CREATE POLICY IF NOT EXISTS "post_comments insert by post family members"
  ON public.post_comments FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_id AND public.is_family_member(p.family_id)
    ) AND author_id = auth.uid()
  );
