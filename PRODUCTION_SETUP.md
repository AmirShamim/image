# ImageStudio - Production Setup Guide

> Complete guide for deploying ImageStudio with zero upfront cost. Pay only when users pay you.

---

## 📋 Current Features Overview

### Core Image Tools
| Feature | Status | Technology |
|---------|--------|------------|
| **Image Upscaling** | ✅ Live | Modal.com Serverless GPU (Real-ESRGAN) |
| **Image Resize** | ✅ Live | Sharp.js (Node.js) |
| **Batch Processing** | ✅ Live | Multi-file ZIP download |
| **Before/After Comparison** | ✅ Live | React slider component |
| **Social Media Presets** | ✅ Live | Instagram, Facebook, YouTube, etc. |

### Technical Infrastructure
| Component | Technology |
|-----------|------------|
| Backend | Node.js + Express 5 (DigitalOcean/Render) |
| Frontend | React + Vite (Vercel) |
| Database | PostgreSQL (production) / SQLite (dev) |
| Image Processing | Modal Serverless Python (PyTorch) + Sharp |
| Payments | Stripe |
| Storage | Local + Cloudinary |

---

## 🚀 Deployment (Optimized for Free/Student Tiers)

### Step 1: Create Accounts

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [DigitalOcean](https://digitalocean.com) | Core Node.js API | $5/mo Basic droplet or App Platform (uses Student Credit) |
| [Vercel](https://vercel.com) | Frontend React App | 100% Free |
| [Modal](https://modal.com) | Serverless AI GPU | $30/mo free compute |
| [Neon](https://neon.tech) | PostgreSQL DB | 500 MB Free |
| [Cloudinary](https://cloudinary.com) | Image Storage | 25 GB/month |

### Step 2: Set Up PostgreSQL (Neon or Supabase)
1. Get a connection string: `postgres://user:pass@db.region.host.com/dbname`

### Step 3: Deploy Frontend to Vercel
1. Link your GitHub repository.
2. Root directory: `client/vite-project`.
3. Vercel automatically detects Vite and builds it. Note: Add rewrites to `vercel.json` if required, or strictly export `VITE_API_URL` pointing to your Backend URL.

### Step 4: Deploy AI Microservice to Modal
1. Create a Modal account.
2. Navigate into `modal-serverless/` and run `modal deploy app.py`.
3. Modal instantly provisions a serverless endpoint running PyTorch on T4 GPUs. Keep track of the HTTP hook URL it generates.

### Step 5: Deploy Backend to DigitalOcean (or Render)
1. App Platform -> Select GitHub Repository.
2. Build command: `npm install`
3. Run command: `node server.js`
4. Define your environment variables in the DO App Dashboard:

```env
# Required
NODE_ENV=production
DATABASE_URL=postgres://user:pass@db.host.com/dbname
JWT_SECRET=generate-a-random-64-character-string-here

# Stripe Integration
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Cloudinary Integration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Modal Serverless Hook
GPU_PROVIDER_URL=https://your-modal-workspace-url.modal.run
```

---

## 📊 Monitoring & Analytics

### Built-in Analytics Dashboard
Access at: `/api/analytics/stats` (admin only).
Tracks page views, upscale usage, and daily trends.

### Rate Limiting Configuration
| Tier | Resize/day | Upscale 2x/day | Upscale 4x/day | Batch |
|------|------------|----------------|----------------|-------|
| Guest | Unlimited | 5 | 3 | ❌ |
| Free | Unlimited | 10 | 5 | ❌ |
| Pro | Unlimited | 100 | 50 | ✅ |
| Business | Unlimited | Unlimited | Unlimited | ✅ |

### Server-side Limits
- **Global**: 200 requests per 15 minutes per IP.
- **Queue**: Max 3 concurrent upscale jobs sent to Modal to prevent VRAM overflow.

---

## 🔒 Security Checklist

- [x] JWT authentication with expiry
- [x] Password hashing (bcrypt)
- [x] Rate limiting
- [x] Request queue
- [x] Dimension constraints matching VRAM limits
- [x] Cloudinary secure URLs

---

## 📁 File Structure

```
image-resizer/
├── client/                          # React + Vite frontend deployment (Vercel)
├── config/                          # Configuration files (Cloudinary, upload)
├── gpu-provider/                    # Client library connecting Node backend to Modal
├── middleware/                      # Auth, rate limiting, queues
├── modal-serverless/                # The isolated Python PyTorch code pushed to Modal
├── routes/                          # Express API routes
├── server.js                        # Node.js entry point
├── database-pg.js                   # Dual DB connector (SQLite local, PG remote)
└── package.json                     # Node.js dependencies
```

**Note:** Legacy `.pb` files, heavy binaries, and `upscale_script.py` were removed in favor of Modal Serverless GPUs to dramatically lower cost and improve upscale processing time.

---

*Last Updated: March 2026*
