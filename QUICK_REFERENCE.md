# ImageStudio - Quick Reference Card

> One-page reference for common tasks and status

---

## 🚦 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend API | ✅ Ready | Express 5 + Node.js |
| Frontend | ✅ Ready | React + Vite |
| Database | ✅ Ready | PostgreSQL (prod) / SQLite (dev) |
| Auth System | ✅ Ready | JWT + Email verification |
| Payments | ✅ Ready | Stripe subscriptions |
| Analytics | ✅ Ready | Built-in dashboard |
| Rate Limiting | ✅ Ready | Server-side + client-side |
| AI Upscaling | ✅ Ready | Real-ESRGAN + 4 fallback models |

---

## ⚡ Quick Commands

```bash
# Development
npm start                    # Start server (localhost:5000)
cd client/vite-project && npm run dev  # Start frontend dev server

# Production build
npm run build               # Build frontend

# Database
# SQLite: data/users.db (auto-created)
# PostgreSQL: Set DATABASE_URL env var

# Load testing
node load-test.js http://localhost:5000 5
```

---

## 🔑 Environment Variables

### Required
```env
NODE_ENV=production
DATABASE_URL=postgres://...
JWT_SECRET=random-64-chars
```

### Optional
```env
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app-password

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE=price_...
STRIPE_PRO_YEARLY_PRICE=price_...
STRIPE_BUSINESS_MONTHLY_PRICE=price_...
STRIPE_BUSINESS_YEARLY_PRICE=price_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 📊 API Endpoints

### Public
```
GET  /api/health          # Server health check
POST /resize              # Resize image
POST /upscale             # Upscale image
POST /get-dimensions      # Get image dimensions
```

### Auth Required
```
GET  /api/users/me        # Get current user
GET  /api/users/history   # Image history
POST /api/stripe/create-checkout-session
POST /api/stripe/create-portal-session
GET  /api/stripe/subscription
```

### Admin Only
```
GET  /api/analytics/stats     # Analytics data
GET  /api/analytics/realtime  # Live visitors
GET  /api/stats               # Server stats
```

---

## 💰 Pricing Tiers

| Tier | Price | Resize | Upscale 2x | Upscale 4x | Batch |
|------|-------|--------|------------|------------|-------|
| Guest | $0 | 20/day | 5/day | 3/day | ❌ |
| Free | $0 | 50/day | 10/day | 5/day | ❌ |
| Pro | $9/mo | ∞ | ∞ | 100/day | ✅ |
| Business | $29/mo | ∞ | ∞ | ∞ | ✅ |

---

## 📁 Key Files

```
server.js           # Main server
database-pg.js      # Database (PostgreSQL/SQLite)
routes/auth.js      # Authentication
routes/stripe.js    # Payments
routes/analytics.js # Analytics
upscale_script.py   # Image processing
```

---

## 🔗 Important URLs

| Page | Path |
|------|------|
| Home | `/` |
| Upscale Tool | `/upscale` |
| Resize Tool | `/resize` |
| Pricing | `/pricing` |
| Analytics (Admin) | `/admin/analytics` |

---

## 📚 Documentation

- `PRODUCTION_SETUP.md` - Deployment guide
- `SAAS_SCALING_GUIDE.md` - Growth strategy
- `load-test.js` - Load testing script

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Routes return 404 | Check server started, check Express middleware order |
| DB connection failed | Verify DATABASE_URL, ensure SSL=true for cloud DBs |
| Images not processing | Check Python deps, verify Real-ESRGAN binary |
| Email not sending | Use Gmail App Password, not regular password |
| Stripe webhook fails | Verify webhook secret, check endpoint URL |

---

## 🎯 Next Steps

1. [ ] Deploy to Render
2. [ ] Set up PostgreSQL (Supabase)
3. [ ] Configure Stripe
4. [ ] Set up UptimeRobot
5. [ ] Launch on Product Hunt
6. [ ] Get first paying customer

---

*January 10, 2026*

