# Apply Comments and Likes Migration

To enable commenting and liking functionality on posts, you need to apply the database migration.

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/0006_post_comments_likes.sql`
4. Click "Run" to execute the migration

## Option 2: Supabase CLI (if linked)

If you have the Supabase CLI linked to your project:

```bash
npx supabase db push
```

## What the migration creates:

- `post_comments` table for storing comments on posts
- `post_likes` table for storing likes on posts
- Proper RLS (Row Level Security) policies
- Indexes for performance
- Triggers for updated_at timestamps

## After applying the migration:

The dashboard will automatically show:
- Like/unlike buttons on posts
- Comment buttons and comment sections
- Real-time like counts
- Comment threads

No additional configuration is needed - the UI components are already implemented and ready to use!
