# 🚀 CHEFAA CLONE - FLY.IO DEPLOYMENT GUIDE

**Last Updated:** December 26, 2025
**Status:** ✅ Production Ready
**Time to Deploy:** 15-20 minutes

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Installation Steps](#installation-steps)
4. [Deployment Process](#deployment-process)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Logs](#monitoring--logs)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)
10. [Cost Estimation](#cost-estimation)

---

## ✅ Prerequisites

### Required
- Fly.io account (free tier available)
- Flyctl CLI installed
- GitHub repository with your code
- Docker (for local testing)

### Account Setup

**1. Create Fly.io Account**
- Visit: https://fly.io/app/sign-up
- Sign up with email or GitHub
- Verify your email

**2. Install Flyctl**

**macOS:**
```bash
brew install flyctl
```

**Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows:**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**3. Verify Installation**
```bash
flyctl --version
# Output: Fly v0.x.x ...
```

**4. Login to Fly.io**
```bash
flyctl auth login
# Opens browser to authenticate
```

### Verify Prerequisites

```bash
# Check all required tools
node --version       # Should be v18+
flyctl --version     # Should be v0.x.x
docker --version     # Should be 20+
git --version        # Should be 2.x+

# Check Fly.io login status
flyctl auth whoami
# Output: your-email@example.com
```

---

## ✅ Pre-Deployment Checklist

Before deploying, verify:

- [ ] Code is committed to GitHub
- [ ] `Dockerfile` is in `chefaa-clone/` folder
- [ ] `fly.toml` is in `chefaa-clone/` folder
- [ ] `.dockerignore` is in `chefaa-clone/` folder
- [ ] `.env` file has correct Supabase credentials
- [ ] `package.json` has `build:prod` script
- [ ] `pnpm-lock.yaml` is committed
- [ ] Node.js version is 18+
- [ ] Flyctl is installed and authenticated
- [ ] Docker daemon is running
- [ ] Git is up to date with latest code

### Verify Your Setup

```bash
# Navigate to project
cd chefaa-clone

# Check Docker can build
docker build -t chefaa-test .

# Check Fly.io login
flyctl auth whoami

# Verify files exist
ls -la Dockerfile fly.toml .dockerignore
```

---

## 🚀 Installation Steps

### Step 1: Navigate to Project

```bash
cd chefaa-clone
```

### Step 2: Verify Environment Variables

```bash
# Check .env file
cat .env

# Should contain:
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=eyJ...
```

**Important:** Fly.io needs these variables!

### Step 3: Initialize Fly.io App (First Time Only)

```bash
# Launch Fly.io configuration
flyctl launch

# You'll be asked:
# - App name (must be globally unique)
# - Region (choose cdg for Europe/closer to Egypt)
# - Database? (N - we use Supabase)
# - Deploy now? (N - we'll do it manually)
```

**After launch:**
- `fly.toml` is created/updated in `chefaa-clone/`
- Use our pre-configured `fly.toml` (already in repo)

### Step 4: Update fly.toml (If Needed)

Our `fly.toml` is already optimized. Check it:

```bash
cat fly.toml

# Verify:
# - app = "chefaa-clone" (your unique app name)
# - regions with code = "cdg" (Paris, closest to Egypt)
# - internal_port = 8080
# - force_https = true
```

**If you need to change app name:**
```bash
# Edit fly.toml
vim fly.toml
# Change: app = "your-unique-app-name"

# Then create app on Fly.io
flyctl apps create your-unique-app-name
```

---

## 🚀 Deployment Process

### Option 1: Deploy with Fly.io (Recommended)

**Step 1: Build Docker Image on Fly.io**
```bash
cd chefaa-clone
flyctl deploy
```

**What happens:**
1. Flyctl reads `fly.toml`
2. Builds Docker image using `Dockerfile`
3. Uploads to Fly.io registry
4. Creates release
5. Deploys to specified regions
6. Runs health checks

**Expected output:**
```
--> Building image with Docker
cloud: Building the image
...
Provisioning ips for chefaa-clone
Elastic ip created
Machine 123abc45 ... created
Monitoring health checks
 ok

Visit your newly deployed app at: https://chefaa-clone.fly.dev
```

### Option 2: Deploy from Dockerfile Locally

**Step 1: Build Docker Image Locally**
```bash
cd chefaa-clone
docker build -t chefaa-clone:latest .
```

**Step 2: Test Locally**
```bash
# Run container
docker run -p 8080:8080 chefaa-clone:latest

# Visit: http://localhost:8080

# Stop with Ctrl+C
```

**Step 3: Deploy to Fly.io**
```bash
flyctl deploy
```

### Option 3: Deploy with GitHub Integration

**Step 1: Add GitHub Secrets**
```bash
flyctl config set FLY_API_TOKEN
# Creates FLY_API_TOKEN for GitHub Actions
```

**Step 2: Create GitHub Actions Workflow**

Create `.github/workflows/fly-deploy.yml`:
```yaml
name: Deploy to Fly.io

on:
  push:
    branches:
      - master
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Step 3: Push to GitHub**
- Changes to `main` branch trigger automatic deployment

---

## 👍 Post-Deployment Verification

### Check Deployment Status

```bash
# Check app status
flyctl status

# Expected output:
# App Status
# Name     Status  Latest Deployment
# chefaa-clone  deployed  v1 ...

# Check running machines
flyctl machines list
```

### Test the App

```bash
# Get app URL
flyctl open
# Opens app in browser

# Or manually:
# Visit: https://chefaa-clone.fly.dev
```

### Verify All Features Work

Test in browser:
- [ ] Homepage loads
- [ ] Responsive design works
- [ ] Navigation works
- [ ] Components render
- [ ] Supabase data loads
- [ ] Cart functionality works
- [ ] No console errors (F12)
- [ ] HTTPS works (green lock)

### Check Logs

```bash
# View recent logs
flyctl logs

# Real-time logs
flyctl logs --follow

# Specific machine
flyctl logs --instance <machine-id>
```

---

## ⚙️ Environment Configuration

### Set Environment Variables on Fly.io

```bash
# List current variables
flyctl secrets list

# Set Supabase URL
flyctl secrets set VITE_SUPABASE_URL=https://hdcpruwk...supabase.co

# Set Supabase Key
flyctl secrets set VITE_SUPABASE_ANON_KEY=eyJ...

# Set other variables as needed
flyctl secrets set NODE_ENV=production
flyctl secrets set VITE_APP_NAME="CHEFAA CLONE"
```

### Verify Secrets

```bash
# List all secrets (doesn't show values)
flyctl secrets list

# Output:
# NAME                    DIGEST      DATE
# VITE_SUPABASE_URL       abc123...   2025-12-26T11:00:00Z
# VITE_SUPABASE_ANON_KEY  def456...   2025-12-26T11:00:00Z
```

### Update Secrets

```bash
# Delete old secret
flyctl secrets unset VITE_SUPABASE_URL

# Set new value
flyctl secrets set VITE_SUPABASE_URL=https://new-url.supabase.co

# Deploy with new secrets
flyctl deploy
```

---

## 📄 Monitoring & Logs

### View Logs

```bash
# Latest logs
flyctl logs

# Follow logs in real-time
flyctl logs --follow

# Last N lines
flyctl logs --lines 50

# Search logs
flyctl logs | grep "error"
```

### Check Health Status

```bash
# Check health checks
flyctl status

# Detailed health
flyctl checks list
```

### Monitor Performance

```bash
# View metrics
flyctl monitor

# Check machine stats
flyctl machines status <machine-id>
```

### View Dashboard

```bash
# Open Fly.io dashboard
flyctl open /admin

# Or visit: https://fly.io/dashboard
```

---

## 🐛 Troubleshooting

### Issue: Deployment Fails with "Dockerfile not found"

**Solution:**
```bash
# Verify location
ls -la chefaa-clone/Dockerfile

# Make sure you're in correct directory
cd chefaa-clone
flyctl deploy
```

### Issue: Build Fails with "pnpm-lock.yaml not found"

**Solution:**
```bash
# Generate lock file
pnpm install --prefer-offline

# Commit to git
git add pnpm-lock.yaml
git commit -m "Update pnpm lock file"

# Deploy again
flyctl deploy
```

### Issue: "App name is already taken"

**Solution:**
```bash
# Edit fly.toml with unique name
vim fly.toml
# Change: app = "chefaa-clone-yourname-123"

# Deploy with new name
flyctl deploy
```

### Issue: Health Checks Failing

**Solution:**
```bash
# Check logs
flyctl logs

# Verify port is 8080
grep "internal_port" fly.toml

# Check Dockerfile exposes port
grep "EXPOSE" Dockerfile

# Restart app
flyctl machines restart
```

### Issue: App Returns 502 Bad Gateway

**Solution:**
```bash
# Check if app is running
flyctl status

# View logs for errors
flyctl logs | tail -20

# Check build succeeded
flyctl releases list

# Redeploy if needed
flyctl deploy
```

### Issue: Supabase Connection Failing

**Solution:**
```bash
# Verify secrets are set
flyctl secrets list

# Check secrets values (don't show in list)
flyctl ssh console
# Inside: echo $VITE_SUPABASE_URL

# Verify .env has correct values locally
cat .env

# Update secrets
flyctl secrets set VITE_SUPABASE_URL=https://correct-url.supabase.co
flyctl deploy
```

### Issue: App Crashes After Deployment

**Solution:**
```bash
# Check logs for errors
flyctl logs --follow

# SSH into machine
flyctl ssh console

# Check running processes
ps aux

# Check disk space
df -h

# Check memory
free -m
```

---

## 🗛️ Advanced Configuration

### Scale Your App

```bash
# Scale to multiple machines
flyctl scale count 2

# Set specific region
flyctl scale count 1 --region=cdg  # Paris
flyctl scale count 1 --region=ams  # Amsterdam

# View machines
flyctl machines list
```

### Configure Custom Domain

```bash
# Add custom domain
flyctl certs add yourdomain.com

# Add www subdomain
flyctl certs add www.yourdomain.com

# View certs
flyctl certs list
```

### Add Persistent Storage

```bash
# Create volume
flyctl volumes create data --size 10

# List volumes
flyctl volumes list

# Update fly.toml [[mounts]] section
vim fly.toml
# Add:
# [[mounts]]
#   source = "data"
#   destination = "/data"

flyctl deploy
```

### Enable SSH Access

```bash
# SSH into machine
flyctl ssh console

# Run command
flyctl ssh console -C "ls -la"

# Exit with Ctrl+D
```

---

## 💵 Cost Estimation

### Free Tier (Included)
- **3 shared-cpu-1x 256MB VMs** - Free
- **160GB outbound bandwidth** - Free
- **Backups & snapshots** - Limited

### Paid Tier (if needed)
- **Shared CPU VM** - $5/month per machine
- **Dedicated CPU** - $15/month per core
- **Memory** - $0.15/GB/month
- **Egress** - $0.02/GB (over 160GB/month)
- **Volume storage** - $0.15/GB/month

### Example Costs

**Minimal Setup (Free):**
- 1 shared-cpu-1x 256MB VM
- Total: **$0/month**

**Small Production (Paid):**
- 1 shared-cpu-1x 256MB VM
- 256MB additional RAM
- Total: **~$8-10/month**

**Medium Production (Paid):**
- 2 shared-cpu-2x 512MB VMs
- 1GB additional RAM
- Custom domain
- Total: **~$15-20/month**

### Monitor Costs

```bash
# View usage
flyctl billing list-resources

# Check quotas
flyctl billing list-organizations

# Set spending limit
# Visit: https://fly.io/dashboard/settings/billing
```

---

## 📚 Useful Commands

```bash
# Deployment
flyctl deploy                 # Deploy app
flyctl deploy --remote-only   # Build on Fly.io

# Status & Info
flyctl status                 # App status
flyctl releases list          # Release history
flyctl machines list          # Running machines

# Logs & Monitoring
flyctl logs                   # View logs
flyctl logs --follow          # Real-time logs
flyctl monitor                # Performance metrics

# Secrets & Config
flyctl secrets list           # List secrets
flyctl secrets set KEY=VALUE  # Set secret
flyctl secrets unset KEY      # Remove secret

# Management
flyctl open                   # Open app in browser
flyctl ssh console            # SSH into machine
flyctl stop                   # Stop app
flyctl resume                 # Resume app
flyctl destroy                # Delete app

# Scaling
flyctl scale count N          # Scale machines
flyctl regions list           # Available regions
```

---

## ✅ Final Checklist

- [ ] Flyctl installed and authenticated
- [ ] Dockerfile exists in `chefaa-clone/`
- [ ] fly.toml exists with correct app name
- [ ] .dockerignore exists
- [ ] .env has Supabase credentials
- [ ] pnpm-lock.yaml is committed
- [ ] Code is pushed to GitHub
- [ ] Docker builds locally without errors
- [ ] `flyctl deploy` completes successfully
- [ ] App opens at https://your-app.fly.dev
- [ ] All features work in production
- [ ] Logs show no errors
- [ ] Health checks pass
- [ ] Custom domain configured (optional)

---

## 📁 Quick Reference

### First Deploy
```bash
cd chefaa-clone
flyctl deploy
```

### Check Status
```bash
flyctl status
flyctl logs
```

### Update Secrets
```bash
flyctl secrets set KEY=VALUE
flyctl deploy
```

### View App
```bash
flyctl open
```

### Troubleshoot
```bash
flyctl logs --follow
flyctl ssh console
```

---

## 🌟 You're Ready!

Your CHEFAA_CLONE is configured for Fly.io deployment.

**Next step:** `flyctl deploy`

**Resources:**
- Fly.io Docs: https://fly.io/docs/
- Status Page: https://status.fly.io/
- Support: https://fly.io/docs/getting-started/support/

---

**Last Updated:** December 26, 2025

**Status:** ✅ Production Ready

**Happy deploying!** 🚀
