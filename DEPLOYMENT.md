# Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (recommended for Next.js) or another hosting platform
- Environment variables configured

## Step 1: Push to GitHub

### 1.1 Create a GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., `supersender`)
3. **DO NOT** initialize with README, .gitignore, or license (we already have these)

### 1.2 Push Your Code
```bash
# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Supersender platform with full features"

# Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### 2.1 Connect Repository
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your GitHub repository

### 2.2 Configure Environment Variables
In Vercel project settings, add these environment variables:

**Required:**
- `DATABASE_URL` - Your Supabase PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production URL (e.g., https://yourdomain.com)

**Optional (for email):**
- `RESEND_API_KEY` - If using Resend for emails
- `NEXT_PUBLIC_WAREHOUSE_PHONE` - Warehouse contact number

**Optional (for payments):**
- `REVOLUT_API_KEY` - If using Revolut payments
- `REVOLUT_WEBHOOK_SECRET` - Revolut webhook secret

### 2.3 Deploy
1. Click "Deploy"
2. Vercel will automatically build and deploy your Next.js app
3. Your app will be live at `https://your-project.vercel.app`

## Step 3: Configure Supabase

### 3.1 Update Supabase Settings
1. Go to Supabase Dashboard → Settings → API
2. Add your Vercel domain to "Allowed Redirect URLs":
   - `https://your-project.vercel.app/api/auth/callback/nextauth`

### 3.2 Run Database Migrations
If you have migrations in `supabase/migrations/`, run them:
```bash
# Using Supabase CLI
supabase db push

# Or manually via Supabase Dashboard SQL Editor
```

## Step 4: Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test authentication (sign up, sign in)
- [ ] Test client dashboard
- [ ] Test warehouse operations
- [ ] Test admin panel
- [ ] Verify email notifications (if configured)
- [ ] Test payment integration (if configured)
- [ ] Check all language translations work
- [ ] Verify images load correctly
- [ ] Test responsive design on mobile

## Step 5: Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable

## Troubleshooting

### Build Errors
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build`

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Supabase connection pooling settings
- Ensure IP is not blocked

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Verify Supabase redirect URLs are configured

## Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run build checks before deploying

## Editing via GitHub

1. Make changes locally
2. Commit: `git commit -m "Description of changes"`
3. Push: `git push origin main`
4. Vercel will automatically deploy the changes

