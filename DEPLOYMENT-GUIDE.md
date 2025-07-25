# 🚀 Deployment Guide - Raffle Ticket System

## GitHub Repository
✅ **Successfully pushed to:** https://github.com/seve-wq/raffle-Thompson.git

## Vercel Deployment Options

### Option 1: Deploy from GitHub (Easiest)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your `raffle-Thompson` repository
5. Vercel will auto-detect Node.js settings
6. **Set Environment Variables** (see below)
7. Click "Deploy"

### Option 2: Deploy with CLI
```bash
# You're already logged in, so run:
vercel

# When prompted:
# - Set up and deploy? → Yes
# - Which scope? → seve dark's projects
# - Link to existing project? → No (create new)
# - Project name? → raffle-thompson (or your choice)
# - Directory? → ./
```

## 🔧 Required Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

### Required Variables:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
```

### Optional Variables:
```
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
PAYPAL_CLIENT_ID=your_paypal_client_id
```

## 📋 Post-Deployment Checklist

1. **✅ Deploy to Vercel**
2. **🔧 Set Environment Variables**
3. **🔗 Set up Stripe Webhook:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-app.vercel.app/api/webhook`
   - Select event: `checkout.session.completed`
   - Copy webhook secret to Vercel env vars
4. **🗄️ Create Supabase Tables:**
   - Run SQL from `supabase-users-table.sql`
   - Create `raffle_tickets` table (see README)
5. **🧪 Test the Application:**
   - Test payment flow with Stripe test cards
   - Verify email delivery
   - Check admin login
6. **🌐 Connect Custom Domain** (optional):
   - Add `raffleroofs.com` in Vercel dashboard

## 🎯 Quick Commands

```bash
# Deploy to production
vercel --prod

# View deployment status
vercel ls

# View logs
vercel logs

# Open project in browser
vercel open
```

## 🔗 Useful Links

- **GitHub Repo:** https://github.com/seve-wq/raffle-Thompson.git
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Supabase Dashboard:** https://supabase.com/dashboard

## 🆘 Troubleshooting

- **Environment Variables:** Make sure all required vars are set
- **Webhook Issues:** Check Stripe webhook logs
- **Email Problems:** Verify Gmail app password
- **Database Errors:** Check Supabase connection

---
**Ready to deploy! 🚀** 