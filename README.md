# Kura

**Nepal, talking.**

Kura is a modern community platform for Nepal — discover communities, share ideas, and connect with people across the country.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment:** Vercel (frontend) + Supabase (backend)

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Kura
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → API** and copy:
   - Project URL
   - Anon (public) key

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Set up the database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `supabase/migrations/001_initial_schema.sql` and copy its contents
4. Paste into the SQL Editor and run the query

This creates all required tables, policies, indexes, triggers, and functions.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see Kura.

### 7. Check system status

Visit [http://localhost:3000/setup](http://localhost:3000/setup) to verify everything is configured correctly.

## Project Structure

```
Kura/
├── public/                    # Static assets
├── supabase/
│   └── migrations/            # SQL migration files
│       └── 001_initial_schema.sql
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── r/[slug]/          # Community pages
│   │   ├── post/[id]/         # Post detail pages
│   │   ├── profile/[username]/ # User profile pages
│   │   ├── submit/            # Create post
│   │   ├── search/            # Search page
│   │   └── setup/             # System status page
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── post/              # Post components
│   │   ├── community/         # Community components
│   │   ├── comments/          # Comment components
│   │   ├── profile/           # Profile components
│   │   └── providers/         # Context providers
│   ├── lib/
│   │   ├── supabase/          # Supabase client setup
│   │   │   ├── client.ts      # Browser client
│   │   │   ├── server.ts      # Server client
│   │   │   └── types.ts       # Database types
│   │   ├── utils.ts           # Utility functions
│   │   └── constants.ts       # App constants
│   └── middleware.ts          # Auth middleware
├── .env.example
├── .env                 # Your local config (git-ignored)
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts         # (Tailwind v4 uses CSS config)
└── tsconfig.json
```

## Database Schema

The database includes the following tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with username, avatar, bio, reputation |
| `communities` | Community definitions with categories and metadata |
| `community_members` | Community membership with roles |
| `posts` | Text/link/image posts with voting |
| `comments` | Threaded comments with depth tracking |
| `votes` | Up/down votes on posts and comments |
| `saved_posts` | Bookmarked posts |
| `reports` | Content reports for moderation |
| `moderation_logs` | Moderation action audit trail |
| `notifications` | User notifications |

All tables have Row Level Security (RLS) policies and proper indexes.

## Features

### Current

- Home feed with trending/popular posts
- Community browsing and discovery
- Post creation (text, link, image types)
- Threaded comments with voting
- User profiles with karma/reputation
- Search for posts and communities
- Dark/light mode with system preference detection
- Responsive design (mobile, tablet, desktop)
- System status/setup page

### Moderation

- Report posts and comments
- Community moderators
- Content removal with reasons
- Moderation logs
- Admin role support

### Architecture

- Supabase RLS for security (no frontend-only checks)
- Server-side auth middleware
- Realtime-ready architecture
- Modular component structure
- Type-safe database access

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | For admin operations |

## Development

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript checks
```

## License

MIT
