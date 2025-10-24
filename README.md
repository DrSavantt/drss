# DRSS - Marketing Agency Operating System

A single-user marketing agency operating system built with Next.js 15, TypeScript, and Supabase.

## 🎯 Project Overview

DRSS is a comprehensive platform for managing marketing agency operations, including:
- Client management and intake
- Project tracking with kanban boards
- AI-powered content generation
- Marketing framework library with RAG
- Landing page builder
- Brand consistency management

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Deployment**: Vercel

## 📦 Project Status

### ✅ Completed Features

- **Feature 0.1**: Project Setup
  - Next.js 15 with TypeScript
  - Tailwind CSS + shadcn/ui base
  - ESLint + Prettier configuration
  
- **Feature 0.2**: Supabase Connection
  - Client/server Supabase utilities
  - Environment variable setup
  - Connection test page at `/test`
  
- **Feature 0.3**: Database Schema
  - Complete 10-table schema
  - Row Level Security (RLS) policies
  - Helper functions and triggers
  - TypeScript type definitions
  
- **Feature 0.4**: Authentication System
  - Email/password authentication with Supabase Auth
  - Protected dashboard routes with middleware
  - Login/logout functionality
  - Server Actions for auth operations

### 🚧 Upcoming Features

- **Feature 1.1**: Client Management
- **Feature 1.2**: Project Kanban
- **Phase 2**: Multi-client views
- **Phase 3**: AI/RAG integration
- **Phase 4**: Page builder

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DrSavantt/drss.git
   cd drss/savant-marketing-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
   ```
   
   Get these values from your Supabase project: **Settings** → **API**

4. **Set up the database**
   
   Follow the complete guide in `supabase/DATABASE_SETUP.md`:
   - Enable pgvector extension
   - Run schema.sql in Supabase SQL Editor
   - Generate TypeScript types
   - Verify all tables created

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

6. **Create your account**
   
   - Visit [http://localhost:3000/login](http://localhost:3000/login)
   - Click "Sign up" with your email and password
   - You'll be automatically logged in and redirected to the dashboard
   - This is a single-user app, so create just one account

7. **Verify setup**
   
   Visit [http://localhost:3000/test](http://localhost:3000/test) to verify Supabase connection

## 📁 Project Structure

```
savant-marketing-studio/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Public auth routes
│   │   └── login/          # Login/signup page
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── layout.tsx      # Dashboard layout with header
│   │   └── page.tsx        # Dashboard home
│   ├── actions/            # Server Actions
│   │   └── auth.ts         # Auth operations
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Root (redirects to dashboard)
│   ├── test/               # Connection test page
│   └── globals.css         # Global styles
├── components/             
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase/           # Supabase utilities
│   │   ├── client.ts       # Browser client
│   │   └── server.ts       # Server client
│   └── utils.ts            # Helper functions
├── supabase/
│   ├── schema.sql          # Complete database schema
│   └── DATABASE_SETUP.md   # Setup instructions
├── types/
│   └── database.ts         # TypeScript types
├── middleware.ts           # Auth middleware (route protection)
└── public/                 # Static assets
```

## 🗄️ Database Schema

The database includes 10 tables supporting all application phases:

**Core Tables:**
- `clients` - Client information and brand data
- `projects` - Project management
- `content_assets` - Generated content

**AI/RAG Tables:**
- `frameworks` - Marketing frameworks
- `framework_embeddings` - Vector embeddings
- `ai_generations` - AI generation history

**Page Builder Tables:**
- `component_templates` - Component definitions
- `pages` - Landing pages
- `component_instances` - Page content

All tables use Row Level Security (RLS) to ensure data isolation per user.

## 📁 File Upload Setup (Feature 1.9)

**MANUAL SETUP REQUIRED:**

1. **Create Supabase Storage Bucket**
   - Go to Supabase Dashboard → Storage
   - Click "New bucket"
   - Name: `client-files` (exactly this, case-sensitive)
   - Public bucket: YES (checked)
   - Click "Create bucket"

2. **Add Storage RLS Policies**
   - Go to Supabase Dashboard → SQL Editor
   - Click "New query"
   - Copy and paste the contents of `supabase/storage-policies.sql`
   - Click "Run" to execute
   - This creates policies to allow authenticated uploads and public downloads

3. **File Upload Features**
   - Upload PDFs, images (JPG, PNG, GIF), Word docs (DOC, DOCX)
   - File size limit: 50MB
   - Files stored in Supabase Storage with public URLs
   - Metadata saved to `content_assets` table
   - Download links in content library

4. **Supported File Types**
   - PDF documents
   - Images: JPG, JPEG, PNG, GIF
   - Documents: DOC, DOCX

## 🔒 Security

- **Row Level Security**: All tables filtered by authenticated user
- **Environment Variables**: Sensitive data in `.env.local` (gitignored)
- **Type Safety**: TypeScript strict mode enabled
- **API Security**: Supabase RLS policies enforce access control

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Testing Supabase Connection

Visit `/test` route to verify:
- ✅ Environment variables loaded
- ✅ Supabase client initialized
- ✅ Connection successful

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Prettier**: Consistent formatting
- **Tailwind**: Utility-first CSS

## 📚 Documentation

- **Database Setup**: `supabase/DATABASE_SETUP.md`
- **Feature Checklist**: `feature_checklist.md`
- **Project Blueprint**: `final_blueprint.md`

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

Add these in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🐛 Troubleshooting

### Supabase Connection Issues

1. Verify `.env.local` exists in project root
2. Check environment variables are correct (no quotes)
3. Restart dev server after changing `.env.local`
4. Visit `/test` to see connection status

### Database Issues

1. Ensure pgvector extension is enabled
2. Verify schema.sql ran without errors
3. Check RLS policies are active (green shields)
4. Review `supabase/DATABASE_SETUP.md`

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## 📝 License

Private project - All rights reserved

## 🔗 Links

- **Repository**: https://github.com/DrSavantt/drss
- **Supabase**: https://supabase.com/dashboard
- **Vercel**: https://vercel.com

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the database infrastructure
- shadcn/ui for the component library
- Vercel for the hosting platform

---

**Current Version**: 0.3.0  
**Status**: Database Schema Complete ✅  
**Next**: Feature 0.4 - Authentication UI
