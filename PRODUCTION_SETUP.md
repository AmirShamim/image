# ImageStudio - Production Setup Guide

> Complete guide for deploying ImageStudio with zero upfront cost. Pay only when users pay you.

---

## 📋 Current Features Overview

### Core Image Tools
| Feature | Status | Technology |
|---------|--------|------------|
| **Image Upscaling** | ✅ Live | Real-ESRGAN, EDSR, FSRCNN, ESPCN |
| **Image Resize** | ✅ Live | Sharp.js, Python CV2 |
| **Batch Processing** | ✅ Live | Multi-file ZIP download |
| **Before/After Comparison** | ✅ Live | React slider component |
| **Social Media Presets** | ✅ Live | Instagram, Facebook, YouTube, etc. |

### AI Models Available
| Model | Quality | Speed | Best For |
|-------|---------|-------|----------|
| Real-ESRGAN Pro | ⭐⭐⭐⭐⭐ | Slow (~3s) | Photos, high quality |
| Real-ESRGAN Fast | ⭐⭐⭐⭐ | Fast (~1s) | General use |
| Real-ESRGAN Anime | ⭐⭐⭐⭐⭐ | Medium (~2s) | Anime, artwork |
| EDSR | ⭐⭐⭐⭐ | Medium | Legacy fallback |
| FSRCNN | ⭐⭐⭐ | Very fast | Quick previews |

### User & Billing System
| Feature | Status |
|---------|--------|
| User Registration | ✅ Email verification |
| JWT Authentication | ✅ 7-day sessions |
| Stripe Payments | ✅ Subscriptions ready |
| Usage Tracking | ✅ Per-user limits |
| Admin Dashboard | ✅ Role-based access |
| Analytics | ✅ Built-in tracking |

### Technical Infrastructure
| Component | Technology |
|-----------|------------|
| Backend | Node.js + Express 5 |
| Frontend | React + Vite |
| Database | PostgreSQL (prod) / SQLite (dev) |
| Image Processing | Python + OpenCV + Real-ESRGAN |
| Payments | Stripe |
| Email | Nodemailer (SMTP) |
| File Storage | Local + Cloudinary (optional) |

---

## 🚀 Deployment (100% Free Tier)

### Step 1: Create Accounts (All Free)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Render](https://render.com) | Hosting | 750 hrs/month |
| [Supabase](https://supabase.com) | PostgreSQL | 500 MB |
| [UptimeRobot](https://uptimerobot.com) | Monitoring | 50 monitors |
| [Stripe](https://stripe.com) | Payments | Pay per transaction |
| [Cloudinary](https://cloudinary.com) | Image CDN | 25 GB/month |

### Step 2: Set Up PostgreSQL (Supabase)

1. Go to [supabase.com](https://supabase.com) → Sign up
2. Create new project (choose closest region)
3. Wait for initialization (~2 min)
4. Go to **Settings → Database → Connection string → URI**
5. Copy the connection string (looks like `postgres://postgres:xxxxx@db.xxxxx.supabase.co:5432/postgres`)

### Step 3: Configure Stripe (When Ready for Payments)

1. Go to [stripe.com](https://stripe.com) → Sign up
2. Get API keys from Dashboard → Developers → API keys
3. Create products:
   - **Pro Plan**: $9/month or $90/year
   - **Business Plan**: $29/month or $290/year
4. Get Price IDs from each product
5. Set up webhook endpoint: `https://your-app.onrender.com/api/stripe/webhook`
6. Get webhook signing secret

### Step 4: Deploy to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Configure:
   - **Name**: `imagestudio` (or your choice)
   - **Runtime**: Python (uses Python + Node)
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `node server.js`

### Step 5: Add Environment Variables

In Render Dashboard → Environment:

```env
# Required
NODE_ENV=production
DATABASE_URL=postgres://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
DATABASE_SSL=true
JWT_SECRET=generate-a-random-64-character-string-here

# Email (Optional but recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Stripe (Add when ready for payments)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRO_MONTHLY_PRICE=price_xxxxx
STRIPE_PRO_YEARLY_PRICE=price_xxxxx
STRIPE_BUSINESS_MONTHLY_PRICE=price_xxxxx
STRIPE_BUSINESS_YEARLY_PRICE=price_xxxxx

# Cloudinary (Optional - for cloud storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Frontend URL (your Render URL)
FRONTEND_URL=https://your-app.onrender.com
```

### Step 6: Set Up UptimeRobot

**Why**: Render free tier sleeps after 15 min inactivity. UptimeRobot pings every 5 min to keep it awake.

1. Go to [uptimerobot.com](https://uptimerobot.com) → Sign up
2. Add New Monitor:
   - **Type**: HTTP(s)
   - **Name**: ImageStudio Health
   - **URL**: `https://your-app.onrender.com/api/health`
   - **Interval**: 5 minutes
3. Add your email for downtime alerts

### Step 7: Make Yourself Admin

In Supabase SQL Editor:

```sql
-- Replace with your actual email
UPDATE users 
SET role = 'admin', subscription_tier = 'admin' 
WHERE email = 'your@email.com';
```

---

## 📊 Monitoring & Analytics

### Built-in Analytics Dashboard

Access at: `https://your-app.onrender.com/admin/analytics` (admin only)

**Tracks automatically:**
- Unique visitors (new vs returning)
- Page views
- Tool usage (resize, upscale, batch)
- Device types & browsers
- Daily/weekly trends

### Health Check Endpoint

```
GET /api/health
```

Returns:
- Server status
- Memory usage
- Active processing jobs
- Uptime

### Server Stats (Admin)

```
GET /api/stats
```

Returns server metrics for monitoring.

---

## 🔧 Rate Limiting Configuration

| Tier | Resize/day | Upscale 2x/day | Upscale 4x/day | Batch |
|------|------------|----------------|----------------|-------|
| Guest | 20 | 5 | 3 | ❌ |
| Free | 50 | 10 | 5 | ❌ |
| Pro | Unlimited | Unlimited | 100 | ✅ |
| Business | Unlimited | Unlimited | Unlimited | ✅ |
| Admin | Unlimited | Unlimited | Unlimited | ✅ |

### Server-side Limits
- **Global**: 200 requests per 15 minutes per IP
- **Processing**: 10 image operations per minute per IP
- **Auth**: 20 login attempts per 15 minutes per IP
- **Concurrent**: Max 3 simultaneous image processes

---

## 📧 Email Configuration (Gmail)

To use Gmail for verification emails:

1. Enable 2-Factor Authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use that password as `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App password, not your regular password
```

---

## 🔒 Security Checklist

- [x] JWT authentication with expiry
- [x] Password hashing (bcrypt, 12 rounds)
- [x] Rate limiting (express-rate-limit)
- [x] Request queue (prevent overload)
- [x] Input validation
- [x] File size limits (50MB max)
- [x] CORS configuration
- [x] SQL parameterized queries
- [ ] Add helmet.js for security headers
- [ ] Enable HTTPS only (Render provides this)
- [ ] Set up CSP headers

---

## 🐛 Troubleshooting

### "Cannot GET /api/health"
- Server might still be deploying
- Check Render logs for errors
- Verify environment variables are set

### Database Connection Failed
- Check DATABASE_URL is correct
- Ensure DATABASE_SSL=true for Supabase
- Verify Supabase project is active

### Email Not Sending
- Verify SMTP credentials
- For Gmail, use App Password not regular password
- Check spam folder

### Images Not Processing
- Check if Python dependencies installed
- Verify Real-ESRGAN binary exists
- Check Render logs for Python errors

### Stripe Webhook Failing
- Verify STRIPE_WEBHOOK_SECRET is correct
- Check webhook endpoint URL is correct
- Test with Stripe CLI locally first

---

## 💰 Cost at Scale

| Users/day | Estimated Cost |
|-----------|----------------|
| 0-100 | $0 (free tier) |
| 100-500 | $7/mo (Render paid) |
| 500-1000 | $14/mo (+ Supabase Pro) |
| 1000+ | $50+/mo (scale infrastructure) |

**Revenue needed to cover costs:**
- $7/mo hosting = 1 Pro user ($9/mo)
- $14/mo = 2 Pro users
- $50/mo = 6 Pro users

---

## 📁 File Structure

```
image-resizer/
├── server.js              # Main Express server
├── database.js            # SQLite (legacy)
├── database-pg.js         # PostgreSQL + SQLite dual support
├── upscale_script.py      # Python image processing
├── requirements.txt       # Python dependencies
├── package.json           # Node dependencies
├── render.yaml            # Render deployment config
├── build.sh               # Build script
├── routes/
│   ├── auth.js            # Authentication
│   ├── users.js           # User management
│   ├── stripe.js          # Payment handling
│   └── analytics.js       # Usage analytics
├── middleware/
│   └── auth.js            # JWT middleware
├── services/
│   └── email.js           # Email sending
├── config/
│   └── cloudinary.js      # Cloud storage
├── client/vite-project/   # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth, Theme)
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utilities
│   └── dist/              # Production build
└── realesrgan/            # AI upscaling binary
```

---

*Last Updated: January 10, 2026*

