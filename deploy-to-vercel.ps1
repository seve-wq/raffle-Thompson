# Deploy Raffle Ticket System to Vercel
# This script helps you deploy your app with proper environment variables

Write-Host "🚀 Deploying Raffle Ticket System to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Check if user is logged in
Write-Host "🔐 Checking Vercel login status..." -ForegroundColor Yellow
vercel whoami

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Vercel. Please run 'vercel login' first." -ForegroundColor Yellow
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Setting up environment variables..." -ForegroundColor Yellow
Write-Host "   You'll be prompted to enter each environment variable." -ForegroundColor Yellow
Write-Host "   Press Enter to skip optional variables." -ForegroundColor Yellow

# Required environment variables
$requiredVars = @(
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY", 
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "EMAIL_USER",
    "EMAIL_PASS",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD"
)

# Optional environment variables
$optionalVars = @(
    "EMAILJS_PUBLIC_KEY",
    "EMAILJS_SERVICE_ID", 
    "EMAILJS_TEMPLATE_ID",
    "PAYPAL_CLIENT_ID"
)

# Set required variables
foreach ($var in $requiredVars) {
    Write-Host "`n🔧 Setting $var (Required):" -ForegroundColor Cyan
    $value = Read-Host "   Enter value for $var"
    if ($value) {
        vercel env add $var
        Write-Host "   ✅ $var set successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $var is required but no value provided" -ForegroundColor Red
        exit 1
    }
}

# Set optional variables
foreach ($var in $optionalVars) {
    Write-Host "`n🔧 Setting $var (Optional):" -ForegroundColor Cyan
    $value = Read-Host "   Enter value for $var (or press Enter to skip)"
    if ($value) {
        vercel env add $var
        Write-Host "   ✅ $var set successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⏭️  Skipped $var" -ForegroundColor Yellow
    }
}

Write-Host "`n🚀 Deploying to Vercel..." -ForegroundColor Green
Write-Host "   This will create a production deployment." -ForegroundColor Yellow

# Deploy to production
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Set up Stripe webhook: https://your-app.vercel.app/api/webhook" -ForegroundColor White
    Write-Host "   2. Create Supabase database tables" -ForegroundColor White
    Write-Host "   3. Test the payment flow" -ForegroundColor White
    Write-Host "   4. Connect your custom domain if needed" -ForegroundColor White
} else {
    Write-Host "`n❌ Deployment failed. Check the error messages above." -ForegroundColor Red
} 