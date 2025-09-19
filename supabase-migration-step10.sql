-- STEP 10: Create trigger for updated_at
DROP TRIGGER IF EXISTS trg_comments_touch ON public.post_comments;
CREATE TRIGGER trg_comments_touch 
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW 
  EXECUTE PROCEDURE public.touch_comment_updated_at();
