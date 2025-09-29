# In Memory of Rudy - Project Plan

## Overview
A beautiful, production-grade memorial website for Rudy Augsburger that allows visitors to view photos, share memories, and contribute their own photos and tributes. Built with Next.js 14, Tailwind CSS, and Supabase, deployed on Vercel.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **ORM**: Drizzle ORM + Zod validation
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Project Structure
```
rudy_site/
├── app/
│   ├── (public)/              # Public routes
│   │   ├── page.tsx          # Home/Hero page
│   │   ├── gallery/
│   │   │   └── page.tsx      # Photo gallery
│   │   └── memories/
│   │       └── page.tsx      # Memory wall
│   ├── (admin)/              # Protected admin routes
│   │   ├── dashboard/
│   │   │   └── page.tsx      # Admin dashboard
│   │   └── layout.tsx        # Admin layout with auth
│   ├── api/                  # API routes (minimal)
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── ui/                   # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Input.tsx
│   │   ├── Lightbox.tsx
│   │   └── index.ts
│   ├── features/             # Feature-specific components
│   │   ├── GalleryGrid.tsx
│   │   ├── PhotoUpload.tsx
│   │   ├── TributeForm.tsx
│   │   ├── MemoryWall.tsx
│   │   └── Hero.tsx
│   └── layout/               # Layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Navigation.tsx
├── db/
│   ├── schema.ts             # Drizzle schema
│   ├── drizzle.config.ts
│   └── migrations/
├── lib/
│   ├── supabase/
│   │   ├── server.ts         # Server client
│   │   └── client.ts         # Browser client
│   ├── auth.ts               # Auth helpers
│   ├── images.ts             # Image processing
│   ├── validation.ts         # Zod schemas
│   ├── rate-limit.ts
│   └── logger.ts
├── policies/                 # Supabase RLS policies
│   ├── contributors.sql
│   ├── photos.sql
│   └── tributes.sql
├── public/
│   ├── images/
│   └── favicon.ico
├── scripts/
│   ├── seed.ts               # Database seeding
│   └── export.ts             # Data export
├── tests/
│   ├── unit/
│   ├── e2e/
│   └── fixtures/
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Design Philosophy

### Visual Design
- **Elegant & Respectful**: Clean, minimal design that honors the memory
- **Warm Color Palette**: Soft, comforting colors (warm grays, gentle blues, cream)
- **Typography**: Readable, elegant fonts (system fonts for performance)
- **Spacing**: Generous whitespace for breathing room
- **Images**: High-quality, properly optimized with meaningful alt text

### User Experience
- **Intuitive Navigation**: Clear, simple menu structure
- **Accessibility First**: WCAG AA compliance, keyboard navigation, screen reader support
- **Mobile Responsive**: Beautiful on all devices
- **Fast Loading**: Optimized images, lazy loading, performance-first approach
- **Emotional Journey**: Guide visitors through viewing → sharing → contributing

## Page Layouts

### 1. Home/Hero Page (`/`)
```
┌─────────────────────────────────────┐
│ Header (Rudy's Name, Navigation)    │
├─────────────────────────────────────┤
│                                     │
│        Hero Section                 │
│    "In Memory of Rudy"              │
│    [Beautiful Photo]                │
│    "Loving Father, Husband, Friend" │
│                                     │
│    [View Gallery] [Share Memory]    │
│                                     │
├─────────────────────────────────────┤
│        Recent Memories              │
│    [3-4 latest approved tributes]   │
│                                     │
├─────────────────────────────────────┤
│        Photo Preview                │
│    [Grid of 6-8 featured photos]    │
│                                     │
├─────────────────────────────────────┤
│ Footer (Contact, Admin Login)       │
└─────────────────────────────────────┘
```

### 2. Photo Gallery (`/gallery`)
```
┌─────────────────────────────────────┐
│ Header with "Photo Gallery"         │
├─────────────────────────────────────┤
│                                     │
│    [Responsive Photo Grid]          │
│    [Lazy Loading, Infinite Scroll]  │
│                                     │
│    [Lightbox on Click]              │
│    - Full-size image                │
│    - Caption & contributor          │
│    - Navigation arrows              │
│    - Keyboard controls              │
│                                     │
├─────────────────────────────────────┤
│ [Upload Photos] Button (if auth)    │
└─────────────────────────────────────┘
```

### 3. Memory Wall (`/memories`)
```
┌─────────────────────────────────────┐
│ Header with "Share Your Memory"     │
├─────────────────────────────────────┤
│                                     │
│    [Tribute Form]                   │
│    - Name (optional)                │
│    - Message (required)             │
│    - Photo (optional)               │
│    - Turnstile verification         │
│                                     │
├─────────────────────────────────────┤
│        Memory Wall                  │
│    [Chronological tributes]         │
│    - Card layout                    │
│    - Name, message, date            │
│    - Associated photo if any        │
│                                     │
└─────────────────────────────────────┘
```

### 4. Admin Dashboard (`/admin/dashboard`)
```
┌─────────────────────────────────────┐
│ Admin Header (Logout, Stats)        │
├─────────────────────────────────────┤
│                                     │
│    [Pending Review Queue]           │
│    - New tributes (approve/reject)  │
│    - New photos (approve/reject)    │
│                                     │
├─────────────────────────────────────┤
│    [Content Management]             │
│    - View all content               │
│    - Soft delete/restore            │
│    - Export data                    │
│                                     │
└─────────────────────────────────────┘
```

## Data Model

### Database Schema (Drizzle)
```typescript
// Contributors table
export const contributors = pgTable("contributors", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

// Photos table
export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  storagePath: text("storage_path").notNull(),
  thumbPath: text("thumb_path").notNull(),
  caption: text("caption"),
  contributorId: uuid("contributor_id").references(() => contributors.id),
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  approved: boolean("approved").default(false).notNull(),
  softDeleted: boolean("soft_deleted").default(false).notNull(),
});

// Tributes table
export const tributes = pgTable("tributes", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name"),
  message: text("message").notNull(),
  contributorId: uuid("contributor_id").references(() => contributors.id),
  associatedPhotoId: uuid("associated_photo_id").references(() => photos.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  approved: boolean("approved").default(false).notNull(),
  softDeleted: boolean("soft_deleted").default(false).notNull(),
});
```

## Key Features Implementation

### 1. Photo Upload & Processing
- **Supported Formats**: JPEG, PNG, HEIC, HEIF, MP4 (short clips)
- **Processing Pipeline**:
  1. Client-side validation (file type, size)
  2. Upload to Supabase Storage (signed URL)
  3. Server-side processing:
     - Convert HEIC/HEIF → JPEG
     - Strip EXIF data
     - Generate thumbnail (640px max)
     - Store metadata in database
- **Storage Structure**:
  - `photos/` bucket (private)
  - `photos-thumbs/` bucket (private)
  - Signed URLs for public display

### 2. Memory Wall System
- **Form Validation**: Zod schemas for all inputs
- **Rate Limiting**: IP + session-based limits
- **Moderation Queue**: All submissions start as `pending`
- **Admin Approval**: Simple approve/reject interface
- **Public Display**: Only approved content shown

### 3. Authentication & Authorization
- **Magic Link Auth**: Supabase Auth with email
- **Admin Access**: Email allowlist in environment variables
- **Row Level Security**: Supabase RLS policies
- **Session Management**: Secure cookie-based sessions

### 4. Image Gallery
- **Responsive Grid**: CSS Grid with Tailwind
- **Lazy Loading**: Intersection Observer API
- **Lightbox**: Accessible modal with keyboard navigation
- **Performance**: `next/image` with proper sizing

## Security Measures

### Content Safety
- **Cloudflare Turnstile**: Bot protection on forms
- **Rate Limiting**: IP and session-based limits
- **Input Validation**: Server-side Zod validation
- **File Upload Security**: Type checking, size limits, virus scanning

### Data Protection
- **RLS Policies**: Database-level access control
- **Signed URLs**: Time-limited access to private storage
- **Environment Variables**: Secure secret management
- **CORS Configuration**: Proper cross-origin policies

## Performance Optimization

### Frontend
- **Next.js App Router**: Server components where possible
- **Image Optimization**: `next/image` with responsive sizing
- **Code Splitting**: Automatic route-based splitting
- **Font Optimization**: System fonts with fallbacks
- **Lazy Loading**: Images and non-critical components

### Backend
- **Database Indexing**: Proper indexes on query patterns
- **Connection Pooling**: Supabase connection optimization
- **Caching**: Static generation where appropriate
- **CDN**: Vercel's global edge network

## Testing Strategy

### Unit Tests (Vitest)
- Component rendering and behavior
- Utility functions and helpers
- Server actions with mocked dependencies
- Validation schemas

### E2E Tests (Playwright)
- Complete user journeys
- Form submissions and validation
- Admin workflows
- Accessibility compliance
- Cross-browser compatibility

### Coverage Requirements
- **Minimum 85%** line and branch coverage
- **100% coverage** for critical paths (auth, uploads, payments)
- **Accessibility tests** on all interactive components

## Deployment & CI/CD

### GitHub Actions Workflow
1. **Install Dependencies**: pnpm with caching
2. **Type Checking**: TypeScript strict mode
3. **Linting**: ESLint with zero warnings
4. **Testing**: Unit and E2E tests
5. **Build**: Production build verification
6. **Deploy**: Automatic deployment to Vercel

### Environment Setup
- **Development**: Local Supabase instance
- **Staging**: Vercel preview deployments
- **Production**: Vercel production with custom domain

## Backup & Export Strategy

### Automated Backups
- **Daily Database Dumps**: Supabase automated backups
- **Storage Backups**: S3/R2 integration for photos
- **Configuration Backups**: Infrastructure as code

### Manual Export
- **Data Export Script**: JSON/CSV of all content
- **Photo Archive**: ZIP file with all images
- **Complete Backup**: Database + storage + configuration

## Accessibility Compliance

### WCAG AA Standards
- **Color Contrast**: Minimum 4.5:1 ratio
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators
- **Alternative Text**: Meaningful alt text for all images

### Testing
- **Automated Testing**: axe-core integration
- **Manual Testing**: Screen reader testing
- **User Testing**: Real accessibility user feedback

## Success Metrics

### Performance
- **Lighthouse Score**: ≥95 for all categories
- **Core Web Vitals**: All metrics in "Good" range
- **Load Time**: <2 seconds for initial page load

### User Experience
- **Accessibility**: WCAG AA compliance
- **Mobile Experience**: Responsive design on all devices
- **Cross-browser**: Support for modern browsers

### Content Management
- **Moderation Efficiency**: Quick approve/reject workflow
- **Data Integrity**: Zero data loss incidents
- **Backup Reliability**: Automated backup success

## Timeline & Milestones

### Phase 1: Foundation (Week 1)
- [ ] Project setup and configuration
- [ ] Database schema and migrations
- [ ] Basic authentication system
- [ ] Core UI components

### Phase 2: Core Features (Week 2)
- [ ] Photo upload and processing
- [ ] Gallery display with lightbox
- [ ] Memory wall with form submission
- [ ] Basic admin dashboard

### Phase 3: Polish & Testing (Week 3)
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Accessibility compliance
- [ ] Security hardening

### Phase 4: Deployment & Launch (Week 4)
- [ ] Production deployment
- [ ] Domain configuration
- [ ] Backup systems
- [ ] Launch preparation

## Maintenance & Support

### Ongoing Tasks
- **Content Moderation**: Regular review of submissions
- **Performance Monitoring**: Track Core Web Vitals
- **Security Updates**: Keep dependencies current
- **Backup Verification**: Test restore procedures

### Future Enhancements
- **Video Support**: Short video clips in gallery
- **Advanced Search**: Search through memories and photos
- **Social Sharing**: Share individual memories
- **Analytics**: Privacy-respecting usage insights

---

This plan provides a comprehensive roadmap for building a beautiful, functional, and maintainable memorial website that honors Rudy's memory while providing a platform for others to share their own memories and photos.
