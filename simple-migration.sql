-- Simple solution: Add JSON columns to existing posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS likes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
