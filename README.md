# RoseSystem Frontend

Next.js 16 UI for ABA therapy billing, AR management, and claims reconciliation.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- **App Router** — File-based routing
- **TypeScript** — Strict type checking
- **Tailwind CSS** — Utility-first styling
- **Turbopack** — Fast bundler in dev

## Project Structure

```
app/
├── layout.tsx       — Root layout
├── page.tsx         — Home page
└── (routes)/        — Feature pages

components/
├── ui/              — Reusable components
└── features/        — Feature-specific components

lib/
├── api.ts           — Backend client
└── hooks/           — Custom React hooks
```

## Development

```bash
# Dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint and format
npm run lint
```

## Connecting to Backend

API base URL configured in `lib/api.ts`. Update for your environment:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```
