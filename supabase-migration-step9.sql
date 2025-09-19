-- STEP 9: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.touch_comment_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;
