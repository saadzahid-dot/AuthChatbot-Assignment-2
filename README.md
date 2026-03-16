# Passly - Full-Stack Authentication System with AI Chat

A modern, production-ready authentication application built with **SvelteKit 5**, **Tailwind CSS**, **Drizzle ORM**, and **PostgreSQL**. Features a polished blue & orange themed UI with dark mode, role-based access control, complete user management, and **Pascal** — an AI-powered chat assistant using **Vercel AI SDK** with **Google Gemini**.

---

## Features

### Authentication
- **Email & Password** sign-up/sign-in with bcrypt hashing (salt 12)
- **OAuth integration** with Google and GitHub via Auth.js
- **Database sessions** with 30-day lifetime and httpOnly cookies
- **Email verification** with 24-hour token expiry and resend capability
- **Password reset** via email with 1-hour secure tokens
- **Password validation** — minimum 8 characters, uppercase, lowercase, and number required

### User Profile
- Editable **first name**, **last name**, **phone number**, **location**, and **bio**
- Profile picture support via OAuth providers (Google/GitHub)
- Change password with current password verification
- OAuth users can set a password to enable dual login
- Account metadata display (User ID, join date, auth method)

### Admin Panel
- Role-based access — only admins can access `/admin`
- **User management** — view all users with search/filter
- **Role toggling** — promote users to admin or demote (admins cannot modify their own role)
- **Enable/Disable users** — toggle user active status from the admin panel
- **User deletion** with cascade (sessions removed)
- **Stats dashboard** — total users, active sessions, verified emails, admin count
- Progress bars showing proportional metrics
- **Secure admin registration** — public registration creates regular users only. Admins can only be created by existing admins.

### Pascal — AI Chat Assistant
- **Vercel AI SDK** with **Google Gemini** model
- Real-time **streaming responses** for instant feedback
- **Personalized welcome** — greets users by name with suggested prompts
- **Conversation branching** — edit and fork past messages without losing history, with left/right arrow navigation between branches
- **Copy & Edit** buttons on user messages (icon-only, appear on hover)
- **Markdown rendering** — code blocks, tables, lists, and formatted text via `marked` and Tailwind Typography
- **Prompt engineering** — system prompt ensures properly formatted responses with fenced code blocks, markdown tables, and structured output
- **Reusable modules** — chat tree logic extracted to `src/lib/chat.ts`; `ChatMessage` and `ChatInput` components encapsulate UI
- **Loading states** — animated typing indicator while AI is generating
- **Error handling** — user-friendly error messages with dismiss capability
- **Clear chat** — reset conversation with one click
- **Protected route** — only authenticated users can access `/chat`
- **Responsive** — expands to fill screen on larger devices
- **Monogram** — "Passly: Secured by Pascal." displayed below the input area

### UI/UX
- **Blue & orange** color theme with dark mode support
- Cream/warm white light mode, deep dark mode
- Glassmorphism card effects with backdrop blur
- Smooth animations — slide-up, fade-in, scale-in, float, shimmer
- Hover lift effects on stat cards with colored shadows
- Responsive design for mobile, tablet, and desktop
- Toast notifications for sign-in/sign-out/registration events
- Loading spinners on all form submissions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | SvelteKit 5 (Svelte 5 runes) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 3.4 + Typography plugin |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **Auth** | Auth.js (@auth/sveltekit) |
| **AI** | Vercel AI SDK + Google Gemini 2.5 Flash |
| **Email** | Nodemailer (SMTP / Ethereal for dev) |
| **Bundler** | Vite 5 |

---

## Project Structure

```
src/
├── app.css                          # Global styles, animations, utilities
├── app.html                         # HTML template with dark mode script
├── app.d.ts                         # TypeScript declarations
├── hooks.server.ts                  # Route protection middleware
├── lib/
│   ├── chat.ts                      # Chat tree logic (reusable module)
│   ├── theme.svelte.ts              # Dark mode state (Svelte 5 runes)
│   ├── components/
│   │   ├── ChatMessage.svelte       # Chat message bubble with branching UI
│   │   └── ChatInput.svelte         # Chat input with auto-resize
│   └── server/
│       ├── auth.ts                  # Auth.js config (providers, callbacks)
│       ├── email.ts                 # Nodemailer email service
│       ├── validation.ts            # Password validation rules
│       └── db/
│           ├── index.ts             # Database connection
│           └── schema.ts            # Drizzle schema (users, sessions, etc.)
└── routes/
    ├── +layout.svelte               # Navbar, toast system, theme toggle
    ├── +layout.server.ts            # Session + role loading
    ├── +page.svelte                 # Home page with role selection
    ├── login/                       # Sign-in (credentials + OAuth)
    ├── register/                    # Sign-up with email verification
    ├── dashboard/                   # User dashboard with stats
    ├── profile/                     # Profile settings (name, phone, bio, etc.)
    ├── admin/                       # Admin panel with user management
    ├── chat/                        # Pascal AI chat interface
    ├── api/chat/                    # Streaming AI chat API endpoint
    ├── forgot-password/             # Password reset request
    ├── reset-password/              # Password reset form
    ├── verify-email/                # Email verification handler
    └── logout/                      # Session cleanup + redirect
```

---

## Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | text | Full name (computed) |
| `first_name` | text | First name |
| `last_name` | text | Last name |
| `email` | text | Unique, required |
| `email_verified` | timestamp | Verification date |
| `image` | text | OAuth profile picture URL |
| `password` | text | Bcrypt hash (nullable for OAuth) |
| `phone` | text | Phone number |
| `bio` | text | Short bio (max 300 chars) |
| `location` | text | City/country |
| `active` | boolean | Account enabled/disabled (default: `true`) |
| `role` | text | `user` or `admin` (default: `user`) |
| `created_at` | timestamp | Account creation date |

### Other Tables
- **accounts** — OAuth provider links (Google, GitHub)
- **sessions** — Active database sessions with expiry
- **verification_tokens** — Email verification and password reset tokens

---

## Getting Started

### Prerequisites
- **Node.js** 18+ with **pnpm**
- **PostgreSQL** database
- **Google Gemini API key** (for Pascal AI chat)
- Google and/or GitHub OAuth credentials (optional)

### 1. Clone and Install

```bash
git clone https://github.com/saadzahid-dot/AuthChatbot-Assignment-2.git
cd AuthChatbot-Assignment-2
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/passly"

# Auth.js
AUTH_SECRET="your-random-secret-key"

# OAuth Providers (optional)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"

# Email (SMTP) — leave empty for Ethereal dev previews
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Passly <noreply@passly.com>"

# Gemini AI (for Pascal chat)
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
```

#### SMTP Setup Options

| Provider | SMTP_HOST | SMTP_PORT | Notes |
|----------|-----------|-----------|-------|
| **Gmail** | `smtp.gmail.com` | `587` | Use an [App Password](https://myaccount.google.com/apppasswords) (requires 2FA) |
| **Outlook** | `smtp-mail.outlook.com` | `587` | Use your account password |
| **SendGrid** | `smtp.sendgrid.net` | `587` | `SMTP_USER=apikey`, `SMTP_PASS=your-api-key` |
| **Dev (Ethereal)** | *(leave empty)* | — | Auto-creates a test inbox; preview URLs logged to console |

### 3. Database Setup

```bash
# Push schema directly to database
pnpm db:push

# Or generate and run migrations
pnpm db:generate
pnpm db:migrate

# (Optional) Open Drizzle Studio GUI
pnpm db:studio
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production

```bash
pnpm build
pnpm preview
```

---

## Setting Up the First Admin

Since admin registration is disabled publicly for security, you need to manually create the first admin:

### Option 1: Direct SQL

Register a user normally, then update via SQL:

```sql
-- Find the user
SELECT id, email, role FROM users;

-- Make them admin
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Option 2: Via Drizzle Studio

```bash
pnpm db:studio
```

Navigate to the `users` table, find your user, and change the `role` field to `admin`.

---

## Route Protection

| Route | Access |
|-------|--------|
| `/` | Public |
| `/login`, `/register` | Public |
| `/forgot-password`, `/reset-password` | Public |
| `/verify-email` | Public |
| `/dashboard` | Authenticated users only |
| `/profile` | Authenticated users only |
| `/chat` (Pascal) | Authenticated users only |
| `/admin` | Admin role only |

Route protection is enforced in `src/hooks.server.ts`. Unauthenticated users are redirected to `/login`, and non-admin users are blocked from `/admin`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm db:generate` | Generate Drizzle migration files |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:push` | Push schema directly to database |
| `pnpm db:studio` | Open Drizzle Studio GUI |

---

## Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- Sessions stored in database with **httpOnly** cookies
- CSRF protection via **Auth.js**
- Route-level protection in **server hooks**
- Token-based email verification and password reset
- Input validation on all server actions
- Pascal chat API endpoint independently verifies authentication
