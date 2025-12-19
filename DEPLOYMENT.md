# Deployment Guide - Vercel

This guide will help you deploy your Finance Tracking app to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your Supabase project URL and anon key
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Push to Git Repository

If you haven't already, initialize a git repository and push to GitHub/GitLab/Bitbucket:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your Git repository
4. Vercel will auto-detect Vite configuration
5. Configure the project:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Environment Variables

**Important**: You must set environment variables in Vercel for the app to work.

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. Click **Save**

6. **Redeploy** your application after adding environment variables:
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**

## Step 4: Verify Deployment

1. Visit your deployment URL (provided by Vercel)
2. Test the application:
   - Set up PIN (if first time)
   - Login with PIN
   - Test adding parties, products, etc.

## Troubleshooting

### Issue: Blank page or routing errors

**Solution**: The `vercel.json` file is already configured to handle SPA routing. If issues persist, ensure the rewrite rule is in place.

### Issue: Environment variables not working

**Solution**: 
- Make sure variable names start with `VITE_`
- Redeploy after adding environment variables
- Check that variables are set for all environments (Production, Preview, Development)

### Issue: Build fails

**Solution**:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try building locally: `npm run build`

### Issue: Supabase connection errors

**Solution**:
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure Supabase URL and key are correct
- Check browser console for specific error messages

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically configure SSL

## Continuous Deployment

Vercel automatically deploys on every push to your main branch. For other branches, it creates preview deployments.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase Documentation](https://supabase.com/docs)
