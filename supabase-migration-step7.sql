-- STEP 7: Create update/delete policies for post_comments
CREATE POLICY IF NOT EXISTS "post_comments update by author or admin"
  ON public.post_comments FOR UPDATE USING (
    author_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_id AND public.is_family_admin(p.family_id)
    )
  );

CREATE POLICY IF NOT EXISTS "post_comments delete by author or admin"
  ON public.post_comments FOR DELETE USING (
    author_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_id AND public.is_family_admin(p.family_id)
    )
  );
