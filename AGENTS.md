# Image Resizer Application - Technical Documentation

## Upscaling Models Overview

Unlike initial versions that relied on heavy monolithic Python subprocesses and `.pb` models running on CPU, ImageStudio now utilizes a scalable, decoupled microservice architecture for AI upscaling.

---

## 🚀 GPU-Accelerated Models (Serverless)

We have discarded slow CPU upscaling (EDSR, FSRCNN, ESPCN) and heavy local binaries. All upscaling is now processed via specialized GPU serverless infrastructure (e.g., **Modal.com**), communicating with our Node.js backend through the `gpu-provider` interface.

### Active Models

We use versions of Real-ESRGAN, optimized for specific use cases and accelerated on T4/A10G GPUs via the cloud.

#### 1. Real-ESRGAN Pro (`realesrgan`)
- **Quality**: Best quality for realistic photos and general images.
- **Scale**: 2x, 4x (Controlled by frontend limits)
- **Tier**: Pro and Business subscribers only
- **Use Case**: Professional photo upscaling requiring high fidelity.
- **Processing Time**: ~3-7 seconds (GPU)

#### 2. Real-ESRGAN Anime (`realesrgan-anime`)
- **Quality**: Best for anime, illustrations, and digital art.
- **Scale**: 2x, 4x
- **Tier**: Free tier and Guest access
- **Use Case**: General purpose, digital art, fast processing.
- **Processing Time**: ~3-7 seconds (GPU)

**Performance**:
Because we use cold-start optimized serverless GPUs, average completion times including network latency stay under 10 seconds, compared to the 2+ minutes required by legacy CPU backends.

---

## 🏗️ Project Structure

### Overall Architecture

```text
Frontend (Vercel) ← REST API → Backend (Node.js on DigitalOcean)
                                         ↓
                                 Database (Neon PostgreSQL)
                                         ↓
                                 Cloud Storage (Cloudinary)
                                         ↓
                         GPU Provider (Modal Serverless Python)
```

### Decoupling the Monolith
1. **Frontend**: React (Vite), deployed on Vercel.
2. **Backend**: Pure Node.js handles auth, queues, and standard image resizing (via `sharp`).
3. **Machine Learning**: Modal handles PyTorch inference.

---

## 📁 Directory Structure

### Root Directory
```text
image-resizer/
├── client/                          # Frontend application (React/Vite)
├── config/                          # Configuration files (Cloudinary, upload config)
├── gpu-provider/                    # Abstraction layer for Serverless GPU calls
├── middleware/                      # Express middlewares (Auth, Rate Limiter, Queue)
├── modal-serverless/                # (External/Isolated) Python definitions for Modal backend
├── routes/                          # Express API routes (auth, images, stripe, analytics)
├── server.js                        # Express server entry point
├── database-pg.js                   # PostgreSQL & SQLite database handler
└── package.json                     # Backend dependencies
```

*Note: All local Python scripts (`upscale_script.py`), `realesrgan` binary folders, and `.pb` TensorFlow models have been removed to drastically reduce repository size and simplify deployment.*

---

## 🔄 Request Flow

### Upscaling Request Flow

```text
1. User uploads image (Frontend)
   ↓
2. POST /api/upscale (Express server)
   ↓
3. Authentication & Tier validation
   ↓
4. Dimension limit check (2048px for 2x, 1024px for 4x)
   ↓
5. Queue middleware (prevents backend overload)
   ↓
6. `gpuProvider.upscale(...)` forwards task to Modal serverless GPU
   ↓
7. Modal GPU processes image and returns output URL/buffer
   ↓
8. Upload to Cloudinary (if authenticated)
   ↓
9. Log to database & Track usage
   ↓
10. Return processed image to Frontend
```

---

## 🔐 Security & Limits

1. **GPU Request Queue** - Limits concurrent requests to the GPU provider to avoid billing spikes and out-of-memory errors on intermediate Node buffers.
2. **Dynamic Check Limits** - Image constraints (e.g., 2048px max) are aligned between frontend and backend to reject massive files before they hit Model inference.
3. **Rate Limiting** - Global limits (200 req/15min) and Auth limits.

---

**Last Updated**: March 2026
**Architecture**: Serverless GPU (Node.js + Modal)
