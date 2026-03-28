# SafeCircle

A lightweight emergency safety-status app. Users sign in with phone + SMS OTP, create family/work groups, follow close contacts, and quickly broadcast whether they are safe during an emergency.

---

## Architecture Summary

```
Next.js 14 App Router  ·  TypeScript  ·  Tailwind + shadcn/ui
Prisma ORM  ·  PostgreSQL  ·  iron-session (cookie auth)
Twilio Verify (SMS OTP)  ·  Web Push (VAPID)
```

### Key design decisions

| Decision | Rationale |
|---|---|
| Server Components first | Data fetching at the page level; no client-side waterfall |
| Server Actions for mutations | `createGroup`, `updateMyStatus`, `followContact`, etc. colocated with UI |
| Route Handlers only for HTTP endpoints | `/api/auth/*`, `/api/alerts/ingest`, `/api/push/subscribe`, `/api/webhooks/twilio` |
| iron-session | Stateless signed cookie; no Redis needed for MVP |
| Prisma `StatusUpdate` append-only | Latest status = `findFirst` with `orderBy: createdAt desc`; full history preserved |
| `AlertEvent` abstraction | `sourceType` field decouples ingest source; plug in external providers without touching status logic |

---

## File Tree

```
safecircle/
├── app/
│   ├── (public)/login/         # Phone + OTP login page
│   ├── (app)/
│   │   ├── dashboard/          # Home dashboard
│   │   ├── groups/[groupId]/   # Group detail + status board
│   │   ├── contacts/           # Following / followers
│   │   ├── alerts/[alertId]/   # Alert detail + response
│   │   └── profile/            # Sign out
│   ├── api/
│   │   ├── auth/request-otp/   # POST – Twilio Verify send
│   │   ├── auth/verify-otp/    # POST – Twilio Verify check + session create
│   │   ├── auth/logout/        # POST – destroy session
│   │   ├── alerts/ingest/      # POST – external alert ingestion
│   │   ├── push/subscribe/     # GET/POST/DELETE – Web Push subscriptions
│   │   └── webhooks/twilio/    # POST – Twilio status callbacks
│   ├── join/[code]/            # Invite link handler
│   ├── layout.tsx
│   └── globals.css
├── actions/
│   ├── group.ts                # createGroup, joinGroupByInviteCode, leaveGroup…
│   ├── status.ts               # updateMyStatus, getGroupMemberStatuses
│   ├── contacts.ts             # followContact, acceptFollowRequest…
│   └── alerts.ts               # triggerMockAlert, respondToAlert
├── components/
│   ├── ui/                     # shadcn primitives (button, card, badge, input…)
│   ├── layout/                 # TopBar, BottomNav
│   ├── auth/                   # LoginFlow
│   ├── groups/                 # GroupCard, MemberList, CreateGroupDialog, InviteLinkCard
│   ├── status/                 # StatusBadge, StatusActionBar, MyStatusCard
│   ├── contacts/               # ContactCard, AddContactDialog, PendingRequestsSection
│   ├── alerts/                 # AlertCard, AlertResponsePrompt, MockAlertButton
│   └── push/                   # PushSubscribeButton
├── lib/
│   ├── auth/session.ts         # iron-session helpers
│   ├── auth/helpers.ts         # requireAuth, requireGroupMember, requireGroupAdmin
│   ├── db/client.ts            # Prisma singleton
│   ├── alerts/processor.ts     # ingestAlert, recordAlertResponse
│   ├── push/webpush.ts         # VAPID send helpers
│   ├── validation/schemas.ts   # Zod schemas
│   └── utils.ts                # cn, timeAgo, formatPhone, generateInviteUrl
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── sw.js                   # Service worker (Web Push)
│   └── manifest.json           # PWA manifest
├── types/index.ts
└── middleware.ts               # Auth redirect guard
```

---

## Route Map

| Route | Description |
|---|---|
| `/` | Redirect → `/dashboard` or `/login` |
| `/login` | Phone + OTP auth |
| `/dashboard` | Home: status, groups, contacts, active alerts |
| `/groups` | Group list |
| `/groups/[groupId]` | Group detail: status board, member list, invite link |
| `/contacts` | Following list, follow requests |
| `/alerts` | Alert list |
| `/alerts/[alertId]` | Alert detail + one-tap response |
| `/profile` | Account, sign out |
| `/join/[code]` | Invite link handler → auto-join + redirect |
| `POST /api/auth/request-otp` | Send OTP via Twilio Verify |
| `POST /api/auth/verify-otp` | Check OTP, create session |
| `POST /api/auth/logout` | Destroy session |
| `POST /api/alerts/ingest` | External alert ingestion (secret-protected) |
| `GET/POST/DELETE /api/push/subscribe` | Web Push subscription management |
| `POST /api/webhooks/twilio` | Twilio status callbacks |

---

## Data Model

```
User ──< UserSession
     ──< ContactFollow (follower / following, state: PENDING|ACCEPTED)
     ──< GroupMember ──> Group
     ──< StatusUpdate (optional groupId → group-scoped status)
     ──< AlertResponse ──> AlertEvent ──> Group?
     ──< PushSubscription
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL (local or Docker)
- (Optional) Twilio account for real SMS

### Steps

```bash
# 1. Clone & install
git clone <repo-url>
cd safecircle
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env – set DATABASE_URL and SESSION_SECRET at minimum

# 3. Run database migrations
npx prisma db push

# 4. Seed demo data
npm run db:seed

# 5. Start dev server
npm run dev
```

Visit `http://localhost:3000`. In dev mode, Twilio is bypassed – use any phone number and OTP **123456**.

Demo users (from seed):
- `+15550000001` – Alice Chen (admin of Chen Family group)
- `+15550000002` – Bob Smith
- `+15550000003` – Carol Reyes
- `+15550000004` – Dave Kim (status: NEED_HELP)

### Generate VAPID keys (for Web Push)

```bash
npx web-push generate-vapid-keys
# Paste output into .env
```

---

## Vercel Deployment

### 1. Database

Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com). Set `DATABASE_URL` in Vercel project settings.

### 2. Environment variables

Set all variables from `.env.example` in **Vercel → Project → Settings → Environment Variables**:

```
DATABASE_URL
SESSION_SECRET        # openssl rand -base64 32
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID
NEXT_PUBLIC_APP_URL   # https://your-app.vercel.app
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
ALERT_INGEST_SECRET
```

### 3. Deploy

```bash
# Push to main or connect repo in Vercel dashboard
vercel deploy --prod
```

### 4. Run migrations on first deploy

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

Or add a `postbuild` script: `"postbuild": "prisma migrate deploy"`

---

## TODO / Future Extensions

### External Alert Provider Integration

The `/api/alerts/ingest` endpoint is designed to accept alerts from any source. To integrate a real provider:

1. Create a new route or webhook handler that receives the provider's payload format
2. Transform it into `IngestAlertInput` (see `lib/alerts/processor.ts`)
3. Call `ingestAlert(input)` – all downstream logic (push, DB) is provider-agnostic

Candidate providers: FEMA IPAWS, PagerDuty, AWS SNS, Everbridge.

### Other future work

- [ ] Avatar upload (S3/R2)
- [ ] Push notification service worker update flow
- [ ] Real-time status with Server-Sent Events or Pusher
- [ ] Admin dashboard for resolving alerts
- [ ] Contact sync (phone address book with permission)
- [ ] Group image upload
- [ ] Rate limiting on OTP endpoint
- [ ] E2E tests (Playwright)
- [ ] Unit tests (Vitest)
