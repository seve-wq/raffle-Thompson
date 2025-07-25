# Thompson's Roofing Raffle Ticket System

A professional raffle ticket payment system built with Stripe, Supabase, and Vercel.

## 🎯 Features

- **Beautiful Payment Interface** - Professional design matching your brand
- **Stripe Integration** - Secure payment processing
- **Automatic Ticket Generation** - Unique 5-digit raffle numbers
- **Email Delivery** - Instant ticket delivery via email
- **Database Storage** - All transactions stored in Supabase
- **Mobile Responsive** - Works perfectly on all devices

## 🚀 Quick Setup

### 0. GitHub Setup (Recommended)

For automatic deployments and version control:

1. **Create GitHub Repository**:
   - Go to [GitHub.com](https://github.com) → New repository
   - Name: `raffle-ticket-system`
   - Don't initialize with README (we have one)

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/raffle-ticket-system.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Vercel**:
   - Go to [Vercel.com](https://vercel.com) → New Project
   - Import your GitHub repository
   - Set environment variables in Vercel dashboard

📖 **Detailed GitHub setup guide**: See `github-setup.md`

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run this SQL to create the tickets table:

```sql
CREATE TABLE raffle_tickets (
  id SERIAL PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  payment_intent_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  quantity INTEGER NOT NULL,
  tickets_per_unit INTEGER NOT NULL,
  total_tickets INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  ticket_numbers TEXT[] NOT NULL,
  status TEXT DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_raffle_tickets_email ON raffle_tickets(customer_email);
CREATE INDEX idx_raffle_tickets_created_at ON raffle_tickets(created_at);
```

4. Go to **Settings > API** and copy:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)

### 2. Stripe Webhook Setup

1. Go to [stripe.com](https://stripe.com) and log in
2. Go to **Developers > Webhooks**
3. Click **Add endpoint**
4. Set URL to: `https://your-domain.vercel.app/api/webhook`
5. Select events: `checkout.session.completed`
6. Copy the **Signing secret** (STRIPE_WEBHOOK_SECRET)

### 3. Email Setup (Gmail)

1. Go to your Google Account settings
2. Enable **2-Factor Authentication**
3. Generate an **App Password** for this project
4. Use your Gmail address and the app password

### 4. Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel login`
3. Set environment variables:

```bash
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
```

4. Deploy: `vercel --prod`

## 🔧 Environment Variables

### Local Development
Create a `.env` file in the root directory using the template in `env-template.txt`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password

# Optional: EmailJS Configuration
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id

# Optional: PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
```

### Vercel Deployment
Use the automated deployment script or set manually:

**Option 1: Automated Setup**
```bash
# Run the deployment script
.\deploy-to-vercel.ps1
```

**Option 2: Manual Setup**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD

# Deploy
vercel --prod
```

## 🧪 Testing

### Test Credit Cards (Stripe Test Mode)

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

### Local Development

1. Install dependencies: `npm install`
2. Set up environment variables
3. Run: `npm run dev`
4. Visit: `http://localhost:3000`

## 📊 Admin Dashboard

To view all tickets, you can query Supabase directly:

```sql
-- View all tickets
SELECT * FROM raffle_tickets ORDER BY created_at DESC;

-- View total sales
SELECT 
  COUNT(*) as total_transactions,
  SUM(amount) as total_revenue,
  SUM(total_tickets) as total_tickets_sold
FROM raffle_tickets;

-- View tickets by customer
SELECT customer_email, customer_name, total_tickets, amount, created_at
FROM raffle_tickets 
WHERE customer_email = 'customer@example.com';
```

## 🎨 Customization

### Ticket Pricing

Edit `public/index.html` to change ticket options:

```html
<div class="ticket-option" data-price="10" data-tickets="1">
    <h3>1 Ticket</h3>
    <div class="price">$10</div>
</div>
```

### Email Template

Edit the email template in `api/webhook.js` to customize the email design.

### Styling

All styles are in the HTML files. The color scheme uses:
- Primary: `#667eea` to `#764ba2` (gradient)
- Success: `#28a745`
- Info: `#17a2b8`

## 🔒 Security

- All payments processed through Stripe (PCI compliant)
- Webhook signature verification
- Environment variables for sensitive data
- HTTPS enforced in production

## 📱 Mobile Responsive

The interface is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Production Checklist

- [ ] Set up Supabase database
- [ ] Configure Stripe webhook
- [ ] Set up email service
- [ ] Deploy to Vercel
- [ ] Set environment variables
- [ ] Test payment flow
- [ ] Update domain DNS (point raffleroofs.com to Vercel)
- [ ] Switch to Stripe live keys
- [ ] Test with real payments

## 📞 Support

For questions or issues:
- Email: info@rafflearoof.com
- Check Vercel logs for debugging
- Monitor Stripe dashboard for payment issues

## 🎉 What Happens After Payment

1. Customer completes payment on Stripe
2. Stripe sends webhook to your server
3. Server generates unique ticket numbers
4. Data saved to Supabase database
5. Confirmation email sent to customer
6. Customer redirected to success page

## 💰 Costs

- **Vercel**: Free tier (Hobby plan)
- **Supabase**: Free tier (50,000 rows)
- **Stripe**: 2.9% + 30¢ per transaction
- **Email**: Free with Gmail (or use Resend/SendGrid)

---

**Built for Thompson's Roofing** 🏠 