# OAL (FamilyHub) - Foundation

A family management application built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be set up (usually takes 1-2 minutes)
3. Go to **Settings** → **API** in your Supabase dashboard
4. Copy your **Project URL** and **anon public** key

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** 
- Get the service role key from **Settings** → **API** → **service_role** (keep this secret!)
- The service role key is server-only and never shipped to the client

### 3. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `/supabase/migrations/0001_init.sql`
4. Click **Run** to execute the migration
5. Copy and paste the entire contents of `/supabase/migrations/0002_dashboard.sql`
6. Click **Run** to execute the dashboard migration

This will create:
- User profiles table
- Families table
- Family memberships table
- Family invites table
- Posts table (for family updates)
- Events table (for family events)
- Event RSVPs table (for event responses)
- Row Level Security (RLS) policies
- Helper functions and RPCs

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Test the Flow

1. **Sign Up**: Create a new account at `/signup`
2. **Onboarding**: You'll be redirected to `/onboarding` where you can:
   - Create a new family
   - Join an existing family with a code
   - Accept pending invitations (if any)
3. **Dashboard**: After completing onboarding, you'll land on `/dashboard`

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication pages
│   │   ├── signin/
│   │   └── signup/
│   ├── (onboarding)/     # Onboarding flow
│   │   └── onboarding/
│   ├── (app)/            # Protected app pages
│   │   ├── layout.tsx    # App shell
│   │   └── dashboard/
│   └── api/              # API routes
│       └── onboarding/
├── lib/
│   ├── supabase/         # Supabase client/server
│   ├── auth.ts           # Auth helpers
│   ├── slug.ts           # Utility functions
│   └── utils.ts          # General utilities
└── components/ui/        # shadcn/ui components
```

## 🔐 Authentication & Authorization

- **Middleware**: Automatically redirects unauthenticated users to sign-in
- **RLS**: Database-level security policies ensure users can only access their family data
- **Session Management**: Uses Supabase SSR for server-side session handling

## 🗄️ Database Schema

- **profiles**: User profiles linked to auth.users
- **families**: Family groups with unique slugs
- **family_members**: Many-to-many relationship with roles (admin/member)
- **family_invites**: Invitation system with codes and email invites

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## 🚀 Deployment

This project is ready for Vercel deployment. The database migration should be run in your Supabase project before deploying.

## 👥 Members & Invites

### For Admins

**Creating Invites:**
1. Go to **Settings** → **Family Members**
2. Click **Invite Member**
3. Optionally enter an email address
4. Click **Create Invite**
5. Copy the generated code or URL to share

**Managing Invites:**
- View all pending invites in the **Pending Invites** section
- Revoke invites by clicking the **Revoke** button
- Invites expire after 14 days

### For New Members

**Joining with a Code:**
1. Sign up for a new account at `/signup`
2. During onboarding, select **Join with Code**
3. Enter the 6-character invite code
4. You'll be automatically added to the family as a member

**Joining via Email Invite:**
1. If you received an email invite, click the link
2. Sign up or sign in
3. You'll be automatically added to the family

### Member Roles

- **Admin**: Can invite/revoke members, manage family settings
- **Member**: Can view family members, limited access to settings

## 📝 Dashboard Features

### Creating Posts
1. Go to the **Dashboard**
2. Click **Create Post** in the Quick Actions section
3. Enter your message (1-5000 characters)
4. Click **Create Post**
5. Your post will appear in the Timeline Feed

### Creating Events
1. Go to the **Dashboard**
2. Click **Create Event** in the Quick Actions section
3. Fill in the event details:
   - **Title** (required, 2-120 characters)
   - **Start Date & Time** (required)
   - **End Date & Time** (optional)
   - **Location** (optional)
   - **Description** (optional)
4. Click **Create Event**
5. The event will appear in the Upcoming Events widget

### RSVP to Events
1. In the **Upcoming Events** widget, find the event you want to RSVP to
2. Click **Going**, **Maybe**, or the **⋯** menu for more options
3. Your RSVP status will be saved and visible to other family members
4. Each family member can RSVP independently

## 📝 Next Steps

This foundation includes:
- ✅ User authentication (sign up/sign in)
- ✅ Family creation and joining
- ✅ Invitation system with codes and email invites
- ✅ Member management (invite, revoke, role-based access)
- ✅ Protected routes and middleware
- ✅ Database schema with RLS
- ✅ Family posts and timeline feed
- ✅ Event creation and RSVP system
- ✅ Dashboard with quick actions

Future features to add:
- Birthday tracking and celebrations
- File sharing
- Notifications
- Family settings and preferences
- Subgroups (coming soon)