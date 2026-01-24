# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cooking Calendar is a French meal planning application built with Astro 5 (SSR mode), Supabase, and Tailwind CSS v4. Users can manage recipes, plan weekly meals, organize reception menus (premium feature), and automatically generate shopping lists.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Format code with Prettier
npx prettier --write .
```

Note: This project has no automated test suite.

## Environment Variables

Required variables in `.env`:
- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key

## Architecture

### Tech Stack
- **Framework**: Astro 5 with SSR (`output: "server"`)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with cookie-based sessions
- **Styling**: Tailwind CSS v4
- **Deployment**: Netlify (via @astrojs/netlify adapter)
- **PDF Generation**: PDFKit (for recipe exports)

### Authentication Flow

Authentication is handled server-side via [src/lib/auth.js](src/lib/auth.js):

- `getServerSession(request)` - Extracts and validates session from cookies, automatically refreshes expired access tokens using refresh tokens
- `getAuthenticatedSupabase(request)` - Returns authenticated Supabase client for API endpoints (alias of getServerSession)
- `setSessionCookies(response, tokens)` - Sets httpOnly session cookies (30-day lifetime)

Session cookies:
- `sb-access-token` - JWT access token
- `sb-refresh-token` - Refresh token for session renewal

All `.astro` pages should call `getServerSession()` once and reuse the returned client to avoid redundant database calls.

### User Roles

Three role levels (hierarchy: admin > premium > free):
- **free**: Default role, limited to 20 recipes, no reception feature
- **premium**: €2.99/month, unlimited recipes, reception menus, PDF export
- **admin**: Full access

Role helpers in [src/lib/auth.js](src/lib/auth.js):
- `hasRole(user, role)` - Check role hierarchy
- `isPremiumOrAdmin(user)` - Check premium access
- `isAdmin(user)` - Check admin access

### Database Schema (Supabase)

Key tables:
- `recipes` - User recipes with ingredients list (JSON)
- `planning` - Weekly meal assignments (composite key: user_id, day)
- `reception` - Reception menus with 4 slots (aperitif, entree, plat, dessert)
- `user_profiles` - User metadata including `user_role` field
- `shopping_totals` - Aggregated shopping list items
- `shopping_custom` - User-added custom shopping items

All queries MUST filter by `user_id` for multi-tenant data isolation.

### Page Structure

- [src/pages/index.astro](src/pages/index.astro) - Landing page (redirects authenticated users to /planning)
- [src/pages/planning.astro](src/pages/planning.astro) - Weekly meal planning (7 days: lundi to dimanche)
- [src/pages/recipes/index.astro](src/pages/recipes/index.astro) - Recipe catalog
- [src/pages/recipes/[id].astro](src/pages/recipes/[id].astro) - Recipe detail/edit page
- [src/pages/reception.astro](src/pages/reception.astro) - Reception menu planning (premium/admin only)
- [src/pages/shoppingList.astro](src/pages/shoppingList.astro) - Shopping list with auto-aggregation
- [src/pages/login.astro](src/pages/login.astro), [src/pages/signup.astro](src/pages/signup.astro) - Auth pages
- [src/pages/account.astro](src/pages/account.astro) - User account management
- [src/pages/premium.astro](src/pages/premium.astro) - Premium upgrade page

### API Endpoints

All API routes in [src/pages/api/](src/pages/api/) follow this pattern:

```javascript
import { getAuthenticatedSupabase } from "../../lib/auth";

export async function POST({ request }) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!supabase || !user) {
    return new Response("Non authentifié", { status: 401 });
  }
  // ... perform database operations filtered by user.id
}
```

Key endpoints:
- `/api/auth/*` - Authentication (login, signup, logout, refresh, me)
- `/api/add-recipe`, `/api/update-recipe`, `/api/delete-recipe` - Recipe CRUD
- `/api/assign-recipe`, `/api/remove-recipe`, `/api/move-recipe` - Planning management
- `/api/assign-reception` - Reception menu assignment
- `/api/compute-shopping-totals` - Generate shopping list from planning
- `/api/save-shopping-totals` - Update shopping list item states
- `/api/custom-items` - Manage custom shopping items
- `/api/export-recipes-pdf` - PDF export (premium feature)

### Performance Optimizations

Recent optimizations (see commit history and [PERFORMANCE.md](PERFORMANCE.md)):

1. **Single session call per page**: Reuse the `supabase` client from `getServerSession()` instead of creating multiple clients
2. **Batch recipe loading**: Use `in()` queries to load multiple recipes in one request
3. **Image optimization**: External images proxied through wsrv.nl with WebP conversion and size limits
4. **Navbar optimization**: Minimized database calls in shared navbar component
5. **Shopping list**: Background saving without blocking UI, optimistic updates
6. **Resource hints**: Preconnect to wsrv.nl and Supabase for faster connections
7. **Cache strategy**: Aggressive caching for static assets (1 year), no cache for SSR/API via [netlify.toml](netlify.toml)
8. **Build optimization**: HTML compression in [astro.config.mjs](astro.config.mjs), CSS/JS handled by Tailwind v4

Performance improvements: ~40-50% faster First Contentful Paint thanks to resource hints and caching

### Image Handling

Recipe images are optimized via the `getOptimizedImageUrl()` helper:
```javascript
function getOptimizedImageUrl(originalUrl, width = 400, quality = 75) {
  // Proxies through wsrv.nl for resizing, format conversion (WebP), and CDN caching
  return `https://wsrv.nl/?url=${originalUrl}&w=${width}&h=${height}&fit=cover&q=${quality}&output=webp`;
}
```

## Important Patterns

### When adding new pages:
1. Always call `getServerSession(Astro.request)` to check auth
2. Redirect unauthenticated users to "/" or "/login"
3. Check user role if feature requires premium/admin
4. Reuse the returned `supabase` client for database queries
5. Filter all queries by `user.id`

### When adding API endpoints:
1. Use `getAuthenticatedSupabase(request)` to get authenticated client
2. Return 401 if user is null
3. Always filter database operations by `user.id`
4. Return JSON responses with proper Content-Type headers

### When working with recipes:
- Free users are limited to 20 recipes (enforce in add/import logic)
- Recipes have an `ingredients` field (JSON array)
- Deleting a recipe should clean up references in `planning` and `reception`

### Deployment:
- Deployed on Netlify via SSR adapter
- Build command: `npm run build`
- Output directory: `dist/`

## Known Issues / Tech Debt

- The [scripts/adminClient.js](scripts/adminClient.js) file references Firebase Admin SDK but the app uses Supabase (appears to be legacy code)
- README.md mentions Firebase but should reference Supabase
- No automated test suite exists
