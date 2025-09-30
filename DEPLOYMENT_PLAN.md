# Rudy Memorial Site - Azure Deployment Plan

## Overview
This document outlines the complete deployment strategy for the Rudy Memorial website on Azure, from initial setup to production-grade configuration.

## Project Context & Current State

### 🏗️ **Project Details**
- **Project Name**: Rudy Memorial Site (`rudy_site`)
- **Domain**: `rememberingrudy.com` (registered with Cloudflare)
- **Framework**: Next.js 15.5.4 with React 19.1.0
- **Styling**: Tailwind CSS with custom theme system
- **Database**: Currently using local JSON files (photos.json, tributes.json)
- **Email**: Nodemailer with Gmail SMTP
- **Authentication**: Simple password-based admin system
- **Development Port**: 6464 (custom port)

### 📁 **Key Project Files**
```
rudy_site/
├── app/
│   ├── (public)/          # Public pages (gallery, memories, memorial-wall)
│   ├── admin/             # Admin dashboard and management
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout with theme
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
├── lib/                   # Utilities, actions, validation
├── public/
│   ├── photos.json        # Photo storage (local JSON)
│   ├── tributes.json      # Memory storage (local JSON)
│   ├── uploads/           # Photo uploads directory
│   └── email-settings.json # Email notification settings
├── .env.local            # Environment variables (see below)
└── package.json          # Dependencies and scripts
```

### 🔧 **Current Environment Variables**
**File**: `.env.local`
```bash
# Admin Configuration
ADMIN_PASSWORD=1964

# Email Configuration (Gmail SMTP)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:6464
```

### 🎨 **Current Features**
- **Photo Gallery**: Masonry layout with slideshow functionality
- **Memory Wall**: Tribute submissions with photo uploads
- **Admin Dashboard**: Photo/memory management, duplicate detection
- **Email Notifications**: Gmail SMTP integration
- **Theme System**: Simplified to "Slate Blue & Silver" default
- **Duplicate Detection**: MD5-based photo duplicate identification
- **Responsive Design**: Mobile-friendly with Tailwind CSS
- **Framer Motion**: Smooth animations and transitions

### 🚀 **Current Scripts**
```bash
npm run dev          # Development server (port 6464)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
npm run typecheck    # TypeScript checking
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

### 📊 **Current Data Storage**
- **Photos**: `public/photos.json` (array of photo objects with MD5 hashes)
- **Memories**: `public/tributes.json` (array of tribute objects)
- **Email Settings**: `public/email-settings.json` (notification configuration)
- **File Uploads**: `public/uploads/` (actual photo files)

### 🔐 **Current Authentication**
- **Admin Access**: Password-protected (`ADMIN_PASSWORD=1964`)
- **Login Page**: `/admin-login`
- **Protected Routes**: All `/admin/*` routes
- **Session**: Cookie-based authentication

### 🎯 **Deployment Goals**
1. **Migrate from local JSON to production storage**
2. **Set up proper email service for production**
3. **Configure domain and SSL**
4. **Implement monitoring and backups**
5. **Optimize for performance and security**

### 📋 **Current Data Structure**
**Photos Object Structure:**
```json
{
  "id": "photo_1759253766368",
  "fileName": "photo_1759253766368.jpg",
  "url": "/uploads/photo_1759253766368.jpg",
  "caption": "I love you Dad.",
  "contributorName": "Alex",
  "fileSize": 4303658,
  "mimeType": "image/jpeg",
  "md5Hash": "774971636a2118b8899691f23ad7e7c0",
  "uploadedAt": "2025-09-30T17:36:06.390Z",
  "approved": true,
  "hidden": false
}
```

**Tributes Object Structure:**
```json
{
  "id": "tribute_1759253766368",
  "message": "Rudy was an amazing person...",
  "contributorName": "Alex",
  "submittedAt": "2025-09-30T17:36:06.390Z",
  "approved": true,
  "hidden": false
}
```

### ⚠️ **Migration Considerations**
- **File Storage**: Currently using local `public/uploads/` directory
- **Data Persistence**: JSON files will need to be migrated to database
- **File Uploads**: Need to implement proper file storage (Azure Blob Storage)
- **Email Service**: Gmail SMTP works but may need production email service
- **Environment Variables**: Need to secure production credentials

### 🔄 **Development vs Production Differences**
| Aspect | Development | Production |
|--------|-------------|------------|
| **Port** | 6464 | 80/443 |
| **Storage** | Local JSON files | Database + Blob Storage |
| **Email** | Gmail SMTP | Production email service |
| **Domain** | localhost:6464 | rememberingrudy.com |
| **SSL** | None | Cloudflare + Azure SSL |
| **Monitoring** | Console logs | Application Insights |

## Prerequisites & Required Tools

### CLI Tools to Install
```bash
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh

# Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
az --version
gh --version
node --version
npm --version
```

### Required Credentials & Accounts
- **Azure Account** with active subscription
- **GitHub Account** with repository access
- **Domain Registrar Account** (for custom domain)
- **Email Service** (for production email notifications)

## Phase 1: Initial Setup & Basic Deployment

### Step 1: Azure Resource Group & App Service Setup
```bash
# Login to Azure
az login

# Create resource group
az group create --name rudy-memorial-rg --location eastus

# Create App Service plan (Free tier for initial deployment)
az appservice plan create \
  --name rudy-memorial-plan \
  --resource-group rudy-memorial-rg \
  --sku FREE \
  --is-linux

# Create web app
az webapp create \
  --resource-group rudy-memorial-rg \
  --plan rudy-memorial-plan \
  --name rudy-memorial-app \
  --runtime "NODE|18-lts"
```

### Step 2: GitHub Repository Setup
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for deployment"

# Create GitHub repository
gh repo create rudy-memorial --public --description "Rudy Augsburger Memorial Website"

# Add remote and push
git remote add origin https://github.com/[YOUR_USERNAME]/rudy-memorial.git
git branch -M main
git push -u origin main
```

### Step 3: Azure GitHub Integration
```bash
# Configure deployment source
az webapp deployment source config \
  --resource-group rudy-memorial-rg \
  --name rudy-memorial-app \
  --repo-url https://github.com/[YOUR_USERNAME]/rudy-memorial \
  --branch main \
  --manual-integration
```

### Step 4: Environment Variables Setup
**Required Production Environment Variables:**

```bash
# Set production environment variables
az webapp config appsettings set \
  --resource-group rudy-memorial-rg \
  --name rudy-memorial-app \
  --settings \
    NODE_ENV=production \
    ADMIN_PASSWORD="[SECURE_PASSWORD]" \
    GMAIL_APP_PASSWORD="[GMAIL_APP_PASSWORD]" \
    GMAIL_USER="[GMAIL_USER]" \
    NEXT_PUBLIC_APP_URL="https://rememberingrudy.com"
```

**Environment Variables Reference:**
- `NODE_ENV=production` - Production environment flag
- `ADMIN_PASSWORD` - Admin login password (currently "1964")
- `GMAIL_USER` - Gmail address for email notifications
- `GMAIL_APP_PASSWORD` - Gmail App Password (16-character)
- `NEXT_PUBLIC_APP_URL` - Production domain URL

**Security Notes:**
- Use a strong, unique password for `ADMIN_PASSWORD`
- Gmail App Password must be generated from Google Account settings
- All sensitive variables are automatically encrypted in Azure

### Step 5: Build Configuration
**Next.js Configuration for Azure:**

The project uses Next.js 15.5.4 with the following build configuration:
- **Output**: Standalone (for Azure App Service)
- **Port**: Dynamic (Azure will set PORT environment variable)
- **Static Files**: Served from `public/` directory

**Required Build Files:**
- `next.config.ts` - Next.js configuration
- `package.json` - Dependencies and scripts
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

**Build Process:**
```bash
npm run build    # Creates .next/standalone directory
npm run start    # Starts production server
```

Create `web.config` in the root directory (if needed for IIS):
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <webSocket enabled="false" />
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
    <iisnode watchedFiles="web.config;*.js"/>
  </system.webServer>
</configuration>
```

## Phase 2: Domain Registration & SSL

### Step 1: Domain Registration ✅ COMPLETED
1. **Domain Registered**: `rememberingrudy.com` ✅
2. **DNS Provider**: Cloudflare ✅
3. **Nameservers**: 
   - `daphne.ns.cloudflare.com`
   - `earl.ns.cloudflare.com`
4. **Status**: Ready for Azure App Service configuration

### Step 2: Cloudflare DNS Configuration
**Add these DNS records in your Cloudflare dashboard:**

**After creating Azure App Service, add these records:**

```
Type: CNAME
Name: @
Target: rudy-memorial-app.azurewebsites.net
Proxy status: Proxied (orange cloud) ✅

Type: CNAME  
Name: www
Target: rudy-memorial-app.azurewebsites.net
Proxy status: Proxied (orange cloud) ✅
```

**Cloudflare Dashboard Steps:**
1. Go to **DNS** → **Records**
2. Click **Add record**
3. Add the CNAME records above
4. Ensure **Proxy status** is enabled (orange cloud icon)
5. Save changes

**Note**: DNS propagation may take 5-15 minutes.

### Step 3: Azure Custom Domain Setup
```bash
# Add custom domain to App Service
az webapp config hostname add \
  --webapp-name rudy-memorial-app \
  --resource-group rudy-memorial-rg \
  --hostname rememberingrudy.com

# Add www subdomain
az webapp config hostname add \
  --webapp-name rudy-memorial-app \
  --resource-group rudy-memorial-rg \
  --hostname www.rememberingrudy.com
```

### Step 4: SSL Certificate (Cloudflare)
**Cloudflare provides free SSL certificates automatically when you enable proxy (orange cloud).**

**In Cloudflare Dashboard:**
1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **"Full (strict)"**
3. Enable **"Always Use HTTPS"**

**Azure Configuration:**
```bash
# Enable HTTPS redirect
az webapp update \
  --resource-group rudy-memorial-rg \
  --name rudy-memorial-app \
  --https-only true
```

### Step 5: Cloudflare Performance Optimization
**Additional Cloudflare settings for better performance:**

**Speed Tab:**
- Enable **Auto Minify** (HTML, CSS, JS)
- Enable **Brotli Compression**
- Enable **Rocket Loader** (optional)

**Caching Tab:**
- Set **Browser Cache TTL** to 1 month
- Enable **Always Online**

**Security Tab:**
- Set **Security Level** to Medium
- Enable **Bot Fight Mode** (free tier)

## Phase 3: Production-Grade Improvements

### Step 1: Upgrade to Standard Tier
```bash
# Upgrade App Service plan for better performance
az appservice plan update \
  --name rudy-memorial-plan \
  --resource-group rudy-memorial-rg \
  --sku S1
```

### Step 2: Database Migration (Optional)
```bash
# Create Azure Database for PostgreSQL
az postgres flexible-server create \
  --resource-group rudy-memorial-rg \
  --name rudy-memorial-db \
  --location eastus \
  --admin-user rudyadmin \
  --admin-password "[SECURE_DB_PASSWORD]" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access 0.0.0.0
```

### Step 3: CDN Setup
```bash
# Create CDN profile
az cdn profile create \
  --resource-group rudy-memorial-rg \
  --name rudy-memorial-cdn \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --resource-group rudy-memorial-rg \
  --profile-name rudy-memorial-cdn \
  --name rudy-memorial-cdn-endpoint \
  --origin rudy-memorial-app.azurewebsites.net
```

### Step 4: Monitoring & Logging
```bash
# Create Application Insights
az monitor app-insights component create \
  --app rudy-memorial-insights \
  --location eastus \
  --resource-group rudy-memorial-rg

# Configure Application Insights
az webapp config appsettings set \
  --resource-group rudy-memorial-rg \
  --name rudy-memorial-app \
  --settings \
    APPINSIGHTS_INSTRUMENTATIONKEY="[INSTRUMENTATION_KEY]"
```

## Phase 4: Security & Performance

### Step 1: Security Headers
Add to `next.config.ts`:
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### Step 2: Rate Limiting Enhancement
Update rate limiting for production:
```typescript
// lib/rate-limit.ts
export const rateLimit = new Map();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // 100 requests per window
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const userLimit = rateLimit.get(ip);
  if (now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}
```

### Step 3: Image Optimization
```bash
# Install Sharp for better image optimization
npm install sharp
```

Update `next.config.ts`:
```typescript
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
}
```

## Phase 5: Backup & Disaster Recovery

### Step 1: Automated Backups
```bash
# Enable backup for App Service
az webapp config backup create \
  --resource-group rudy-memorial-rg \
  --webapp-name rudy-memorial-app \
  --backup-name daily-backup \
  --container-url "[STORAGE_CONTAINER_URL]" \
  --frequency 1d \
  --retention 30d
```

### Step 2: Staging Environment
```bash
# Create staging slot
az webapp deployment slot create \
  --name rudy-memorial-app \
  --resource-group rudy-memorial-rg \
  --slot staging
```

## Data Migration Strategy

### 📁 **Current Data to Migrate**
**Files to Backup Before Deployment:**
- `public/photos.json` - All photo metadata and MD5 hashes
- `public/tributes.json` - All memory submissions
- `public/email-settings.json` - Email notification configuration
- `public/uploads/` - All uploaded photo files

**Migration Steps:**
1. **Backup Current Data**: Download all JSON files and uploads directory
2. **Deploy Application**: Deploy to Azure with local JSON storage initially
3. **Test Functionality**: Verify all features work with current data
4. **Plan Database Migration**: Design database schema for future migration
5. **Implement Blob Storage**: Move file uploads to Azure Blob Storage

### 🔄 **Temporary Production Setup**
For initial deployment, the app will continue using:
- **Local JSON files** for data storage (photos.json, tributes.json)
- **Local file system** for photo uploads (public/uploads/)
- **Gmail SMTP** for email notifications

This allows for quick deployment while planning the full database migration.

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Current data backed up (photos.json, tributes.json, uploads/)
- [ ] SSL certificates configured
- [x] Domain DNS configured (`rememberingrudy.com` with Cloudflare)
- [ ] GitHub repository set up
- [ ] Azure resources created

### Post-Deployment
- [ ] Website accessible via custom domain
- [ ] HTTPS redirect working
- [ ] Admin login functional
- [ ] Photo upload working
- [ ] Email notifications working
- [ ] Performance monitoring active
- [ ] Backup strategy implemented

## Cost Estimation (Monthly)

### Phase 1 (Basic)
- **App Service (Free)**: $0
- **Domain**: ~$12/year
- **Total**: ~$1/month

### Phase 2 (Standard)
- **App Service (S1)**: ~$75
- **Domain**: ~$12/year
- **SSL Certificate**: Free (Let's Encrypt)
- **Total**: ~$76/month

### Phase 3 (Production)
- **App Service (S1)**: ~$75
- **Database (B1ms)**: ~$25
- **CDN**: ~$5
- **Application Insights**: ~$10
- **Domain**: ~$12/year
- **Total**: ~$115/month

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version compatibility
2. **Environment Variables**: Verify all required variables are set
3. **Database Connection**: Check connection strings and firewall rules
4. **SSL Issues**: Verify domain configuration and certificate status
5. **Performance**: Monitor Application Insights for bottlenecks

### Useful Commands
```bash
# View logs
az webapp log tail --resource-group rudy-memorial-rg --name rudy-memorial-app

# Restart app
az webapp restart --resource-group rudy-memorial-rg --name rudy-memorial-app

# Check app status
az webapp show --resource-group rudy-memorial-rg --name rudy-memorial-app --query state
```

## Next Steps After Deployment

1. **SEO Optimization**: Add meta tags, sitemap, robots.txt
2. **Analytics**: Implement Google Analytics or similar
3. **Performance**: Monitor and optimize based on real usage
4. **Security**: Regular security audits and updates
5. **Content**: Regular backup and content management procedures

---

**Note**: This plan starts simple and scales up. Begin with Phase 1 to get the site live quickly, then iterate through subsequent phases based on needs and budget.
