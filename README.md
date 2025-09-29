# In Memory of Rudy - Memorial Website

A beautiful, production-grade memorial website built with Next.js 15, TypeScript, Tailwind CSS, and Supabase. This site allows visitors to view photos, share memories, and contribute their own photos and tributes in honor of Rudy Augsburger.

## Features

- **Beautiful Design**: Elegant, responsive design with warm colors and thoughtful typography
- **Photo Gallery**: Responsive grid layout with lightbox functionality
- **Memory Wall**: Form for sharing memories and tributes
- **Admin Dashboard**: Content moderation and management system
- **Authentication**: Secure admin access with email-based authentication
- **Image Processing**: Automatic HEIC conversion, EXIF stripping, and thumbnail generation
- **Accessibility**: WCAG AA compliant with keyboard navigation and screen reader support
- **Performance**: Optimized images, lazy loading, and Lighthouse scores ≥95
- **Security**: Rate limiting, input validation, and RLS policies

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **ORM**: Drizzle ORM with Zod validation
- **Testing**: Vitest (unit), Playwright (e2e)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rudy_site
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   DATABASE_URL=your_database_url
   ADMIN_EMAILS=admin@example.com,another@example.com
   ```

4. **Set up Supabase**
   
   Create a new Supabase project and run the SQL policies:
   ```bash
   # Apply RLS policies
   psql -h your-db-host -U postgres -d postgres -f policies/contributors.sql
   psql -h your-db-host -U postgres -d postgres -f policies/photos.sql
   psql -h your-db-host -U postgres -d postgres -f policies/tributes.sql
   ```

   Create storage buckets:
   - `photos` (private)
   - `photos-thumbs` (private)

5. **Run database migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
rudy_site/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes
│   ├── (admin)/           # Protected admin routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── features/         # Feature components
│   └── layout/           # Layout components
├── db/                   # Database schema and config
├── lib/                  # Utilities and helpers
├── policies/             # Supabase RLS policies
├── tests/                # Test files
└── scripts/              # Utility scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:coverage` - Run tests with coverage
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `.next` folder to your hosting provider

## Admin Access

Admin access is controlled by the `ADMIN_EMAILS` environment variable. Add admin email addresses separated by commas:

```env
ADMIN_EMAILS=admin@example.com,another@example.com
```

Admins can:
- Approve/reject photos and memories
- View all content (approved and pending)
- Export data
- Manage contributors

## Content Moderation

All user-submitted content (photos and memories) starts in a "pending" state and requires admin approval before being visible to the public. This ensures appropriate content while allowing community contributions.

## Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Rate Limiting**: Prevents spam and abuse
- **Input Validation**: Server-side validation with Zod
- **File Upload Security**: Type checking and size limits
- **Authentication**: Secure admin access with Supabase Auth

## Performance

- **Image Optimization**: Automatic resizing and format conversion
- **Lazy Loading**: Images load as needed
- **CDN**: Vercel's global edge network
- **Caching**: Optimized caching strategies

## Accessibility

- **WCAG AA Compliance**: Meets accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: Minimum 4.5:1 ratio
- **Focus Management**: Visible focus indicators

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is private and intended for memorial purposes only.

## Support

For questions or support, please contact the project maintainers.

---

Built with ❤️ in memory of Rudy Augsburger