# GitHub Setup Guide for Raffle Ticket System

## 🚀 Setting Up GitHub Repository

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `raffle-ticket-system`
   - **Description**: `Professional raffle ticket payment system for Thompson's Roofing`
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README (we already have one)
4. Click **"Create repository"**

### Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/raffle-ticket-system.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify Upload

1. Go to your GitHub repository page
2. You should see all your files:
   - `api/` folder with serverless functions
   - `public/` folder with HTML files
   - `package.json`, `vercel.json`, etc.
   - **Note**: Your `.env` file should NOT be visible (it's in `.gitignore`)

## 🔗 Connecting GitHub to Vercel

### Option 1: Automatic Deployment (Recommended)

1. Go to [Vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository:
   - Select your `raffle-ticket-system` repository
   - Vercel will automatically detect it's a Node.js project
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: Leave empty (no build step)
   - **Output Directory**: Leave empty
5. Click **"Deploy"**

### Option 2: Manual Deployment

If you prefer to keep using the CLI:

```bash
# In your project directory
vercel --prod
```

## 🔧 Setting Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Click **"Settings"** tab
3. Click **"Environment Variables"**
4. Add each variable from your `.env` file:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
```

### Method 2: Vercel CLI

```bash
# Set each environment variable
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
```

## 🔄 Automatic Deployments

Once connected to GitHub, Vercel will:

- ✅ **Automatically deploy** when you push to `main` branch
- ✅ **Create preview deployments** for pull requests
- ✅ **Redeploy** when you update environment variables
- ✅ **Show deployment status** in GitHub

## 📝 Making Updates

### Workflow for Updates:

1. **Make changes** to your code locally
2. **Test locally**: `npm run dev:local`
3. **Commit changes**:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```
4. **Push to GitHub**:
   ```bash
   git push origin main
   ```
5. **Vercel automatically deploys** the changes

### Example Update Workflow:

```bash
# Make your changes to files
# Test locally
npm run dev:local

# Commit and push
git add .
git commit -m "Updated ticket pricing and improved UI"
git push origin main

# Vercel automatically deploys in ~1-2 minutes
```

## 🔒 Security Best Practices

### ✅ What's Protected:
- `.env` file (in `.gitignore`)
- `node_modules/` (in `.gitignore`)
- Environment variables (stored securely in Vercel)

### ⚠️ What to Check:
- No API keys in your code
- No passwords in comments
- No sensitive data in commits

## 🎯 Benefits of GitHub + Vercel

1. **Version Control**: Track all changes and rollback if needed
2. **Automatic Deployments**: Push code → Auto-deploy to production
3. **Preview Deployments**: Test changes before merging
4. **Collaboration**: Easy to work with team members
5. **Backup**: Your code is safely stored in the cloud
6. **CI/CD**: Continuous integration and deployment

## 🚨 Important Notes

1. **Never commit `.env` files** - they're in `.gitignore` for a reason
2. **Use environment variables** in Vercel dashboard for production
3. **Test locally first** before pushing to GitHub
4. **Check deployment logs** in Vercel if something goes wrong

## 📞 Need Help?

- **GitHub Issues**: Create issues in your repository
- **Vercel Support**: Check Vercel dashboard for deployment issues
- **Local Testing**: Use `npm run dev:local` to test before pushing

---

**Your raffle ticket system is now ready for professional deployment! 🎉** 