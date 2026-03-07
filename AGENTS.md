# Image Resizer Application - Technical Documentation

## Upscaling Models Overview

This application uses multiple AI-powered upscaling models with different acceleration capabilities and use cases.

---

## 🚀 GPU-Accelerated Models

### 1. Real-ESRGAN (GPU Accelerated via Vulkan)

**Location**: `realesrgan/realesrgan-ncnn-vulkan.exe`

**GPU Acceleration**: ✅ **YES** - Uses NCNN framework with Vulkan backend
- Works with NVIDIA, AMD, and Intel GPUs
- Cross-platform GPU API support
- Falls back to CPU if no GPU is detected

**Variants**:

#### Real-ESRGAN Pro (`realesrgan-x4plus`)
- **Model Size**: 32MB
- **Quality**: Best quality for photos
- **Scale**: 4x only
- **Tier**: Pro and Business subscribers only
- **Use Case**: Professional photo upscaling

#### Real-ESRGAN Fast (`realesr-animevideov3`)
- **Model Size**: 1.2MB
- **Quality**: Good quality, fast processing
- **Scale**: 2x, 3x, 4x
- **Tier**: Free tier (default)
- **Use Case**: General purpose, video frames, fast processing

#### Real-ESRGAN Anime (`realesrgan-x4plus-anime`)
- **Model Size**: 8.5MB
- **Quality**: Best for anime/artwork
- **Scale**: 4x only
- **Tier**: All tiers
- **Use Case**: Anime, illustrations, digital art

**Performance**:
| Environment | Processing Time (512x512 image) |
|-------------|--------------------------------|
| With GPU | 1-5 seconds |
| Without GPU (CPU fallback) | 15-120 seconds |

**Technical Details**:
- Framework: NCNN (Neural Network Computing Framework)
- Backend: Vulkan API
- Executable: Windows binary (6.1MB)
- Dependencies: `vcomp140.dll`, `vcomp140d.dll`

---

## 💻 CPU-Only Models (OpenCV DNN)

These models use OpenCV's `dnn_superres` module and run exclusively on CPU.

### 2. EDSR (Enhanced Deep Residual Networks)

**Files**: 
- `EDSR_x2.pb` (38.5MB)
- `EDSR_x4.pb` (38.6MB)

**GPU Acceleration**: ❌ **CPU ONLY**
- Requires CUDA toolkit + NVIDIA GPU + OpenCV compiled with CUDA for GPU support
- Default `opencv-python-headless` package doesn't include CUDA

**Specifications**:
- **Quality**: High quality (legacy)
- **Scale**: 2x, 4x
- **Processing**: Uses tiling for large images to prevent RAM overflow
- **Tile Size**: 256px with 16px overlap
- **Max Direct Processing**: 512x512 pixels (without tiling)

**Use Case**: High-quality upscaling when Real-ESRGAN is unavailable

**Performance**: 10-30 seconds (CPU, varies by image size)

---

### 3. FSRCNN (Fast Super-Resolution Convolutional Neural Network)

**Files**:
- `FSRCNN_x2.pb` (38KB)
- `FSRCNN_x3.pb` (40KB)
- `FSRCNN_x4.pb` (41KB)

**GPU Acceleration**: ❌ **CPU ONLY**

**Specifications**:
- **Quality**: Fast, moderate quality
- **Scale**: 2x, 3x, 4x
- **Model Size**: Very small (~40KB)
- **Speed**: Fastest CPU model

**Use Case**: Quick upscaling, lite mode fallback

**Performance**: 2-5 seconds (CPU)

---

### 4. ESPCN (Efficient Sub-Pixel Convolutional Neural Network)

**Files**:
- `ESPCN_x2.pb` (86KB)
- `ESPCN_x3.pb` (92KB)
- `ESPCN_x4.pb` (100KB)

**GPU Acceleration**: ❌ **CPU ONLY**

**Specifications**:
- **Quality**: Good balance of speed and quality
- **Scale**: 2x, 3x, 4x
- **Model Size**: Small (~100KB)
- **Speed**: Fast

**Use Case**: Fallback when FSRCNN is unavailable

**Performance**: 3-8 seconds (CPU)

---

## 📊 Model Comparison Summary

| Model | GPU Support | Scales | Model Size | Quality | Speed (GPU) | Speed (CPU) | Tier Required |
|-------|-------------|--------|------------|---------|-------------|-------------|---------------|
| Real-ESRGAN Pro | ✅ Vulkan | 4x | 32MB | Excellent | 2-5s | 30-120s | Pro/Business |
| Real-ESRGAN Fast | ✅ Vulkan | 2x, 3x, 4x | 1.2MB | Good | 1-2s | 15-60s | Free |
| Real-ESRGAN Anime | ✅ Vulkan | 4x | 8.5MB | Excellent (anime) | 2-3s | 20-80s | All |
| EDSR | ❌ CPU | 2x, 4x | 38MB | High | N/A | 10-30s | All |
| FSRCNN | ❌ CPU | 2x, 3x, 4x | 40KB | Moderate | N/A | 2-5s | All |
| ESPCN | ❌ CPU | 2x, 3x, 4x | 100KB | Good | N/A | 3-8s | All |

---

## 🏗️ Project Structure

### Overall Architecture

```
Frontend (React/Vite) ←→ Backend (Express/Node.js) ←→ Python Processing Scripts
                                    ↓
                            Database (PostgreSQL/SQLite)
                                    ↓
                            Cloud Storage (Cloudinary)
```

---

## 📁 Directory Structure

### Root Directory
```
image-resizer/
├── client/                          # Frontend application
│   └── vite-project/               # React + Vite project
│       ├── src/
│       │   ├── components/         # React components (24 files)
│       │   ├── pages/              # Page components (23 files)
│       │   ├── context/            # React contexts (Auth, Theme, Toast)
│       │   ├── hooks/              # Custom React hooks
│       │   ├── i18n/               # Internationalization (8 languages)
│       │   ├── services/           # API services
│       │   ├── utils/              # Utility functions
│       │   ├── App.jsx             # Main app component
│       │   ├── ImageProcessor.jsx  # Image processing UI
│       │   └── main.jsx            # Entry point
│       ├── public/                 # Static assets
│       ├── dist/                   # Production build
│       ├── index.html              # HTML template
│       ├── package.json            # Frontend dependencies
│       ├── vite.config.js          # Vite configuration
│       └── tailwind.config.js      # Tailwind CSS config
│
├── realesrgan/                     # Real-ESRGAN GPU models
│   ├── realesrgan-ncnn-vulkan.exe  # Main executable (6.1MB)
│   ├── models/                     # Model files (10 files)
│   ├── vcomp140.dll                # Dependencies
│   ├── vcomp140d.dll
│   └── README_windows.md
│
├── routes/                         # Express API routes
│   ├── auth.js                     # Authentication endpoints
│   ├── users.js                    # User management
│   ├── stripe.js                   # Payment processing
│   └── analytics.js                # Analytics tracking
│
├── middleware/                     # Express middleware
│   └── auth.js                     # JWT authentication
│
├── config/                         # Configuration files
│   └── cloudinary.js               # Cloudinary setup
│
├── components/                     # Server-side components
│   ├── AdminDashboard.tsx
│   ├── Navbar.tsx
│   ├── RoleBasedFeature.tsx
│   └── UserRoleBadge.tsx
│
├── lib/                            # Library code
│   ├── hooks/
│   ├── middleware/
│   └── models/
│
├── data/                           # Database files
│   └── users.db                    # SQLite database
│
├── uploads/                        # Temporary upload directory
├── processed/                      # Processed images (served statically)
├── profile_pictures/               # User profile pictures
│
├── server.js                       # Express server (592 lines)
├── upscale_script.py               # Python upscaling logic (379 lines)
├── database.js                     # SQLite database handler
├── database-pg.js                  # PostgreSQL database handler
├── package.json                    # Backend dependencies
├── requirements.txt                # Python dependencies
│
├── EDSR_x2.pb                      # EDSR 2x model (38.5MB)
├── EDSR_x4.pb                      # EDSR 4x model (38.6MB)
├── FSRCNN_x2.pb                    # FSRCNN 2x model (38KB)
├── FSRCNN_x3.pb                    # FSRCNN 3x model (40KB)
├── FSRCNN_x4.pb                    # FSRCNN 4x model (41KB)
├── ESPCN_x2.pb                     # ESPCN 2x model (86KB)
├── ESPCN_x3.pb                     # ESPCN 3x model (92KB)
├── ESPCN_x4.pb                     # ESPCN 4x model (100KB)
│
└── Documentation/
    ├── GPU_USAGE_GUIDE.md          # GPU acceleration guide
    ├── PRODUCTION_SETUP.md         # Production deployment
    ├── SAAS_SCALING_GUIDE.md       # Scaling strategies
    ├── EMAIL_SETUP.md              # Email configuration
    ├── GROWTH_RECOMMENDATIONS.md   # Growth strategies
    └── QUICK_REFERENCE.md          # Quick reference
```

---

## 🎨 Frontend Architecture

### Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context API
- **HTTP Client**: Fetch API

### Key Components

#### Pages (11 main pages)
1. **HomePage** - Landing page
2. **UpscalePage** - AI upscaling tool
3. **ResizePage** - Image resizing tool
4. **ToolsPage** - Tools overview
5. **PricingPage** - Subscription plans
6. **AboutPage** - About the service
7. **ContactPage** - Contact form
8. **FAQPage** - Frequently asked questions
9. **APIPage** - API documentation
10. **PrivacyPage** - Privacy policy
11. **TermsPage** - Terms of service

#### Core Components
- **ImageProcessor** - Main image processing interface
- **ImageUpscaler** - Upscaling-specific UI
- **AuthModal** - Login/Register modal
- **UserProfile** - User account management
- **PricingModal** - Subscription upgrade modal
- **UsageMeter** - Daily usage tracking
- **BatchProcessor** - Batch image processing
- **ImageComparison** - Before/after comparison
- **AnalyticsDashboard** - Admin analytics

#### Context Providers
- **AuthContext** - User authentication state
- **ThemeContext** - Dark/light theme
- **ToastContext** - Notification system

#### Internationalization
Supports 8 languages:
- English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese

---

## ⚙️ Backend Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Stripe
- **Cloud Storage**: Cloudinary
- **Image Processing**: Python + OpenCV + Real-ESRGAN

### Core Features

#### API Endpoints

**Authentication** (`/api/auth`)
- `POST /login` - User login
- `POST /register` - User registration
- `POST /verify-email` - Email verification
- `POST /forgot-password` - Password reset

**Users** (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `GET /images` - Get user's image history
- `DELETE /images/:id` - Delete image

**Image Processing**
- `POST /upscale` - AI upscaling (2x, 3x, 4x)
- `POST /resize` - Image resizing
- `POST /get-dimensions` - Get image dimensions

**Payments** (`/api/stripe`)
- `POST /create-checkout-session` - Start subscription
- `POST /webhook` - Stripe webhook handler
- `POST /cancel-subscription` - Cancel subscription

**Analytics** (`/api/analytics`)
- `GET /stats` - Usage statistics
- `POST /track` - Track events

**Monitoring**
- `GET /api/health` - Health check
- `GET /api/stats` - Server statistics

#### Middleware

**Rate Limiting**
- Global: 200 requests per 15 minutes
- Processing: 10 images per minute
- Auth: 20 login attempts per 15 minutes

**Request Queue**
- Max concurrent processes: 3
- Prevents server overload
- Returns 503 when queue is full

**Authentication**
- JWT-based authentication
- Optional auth for guest users
- Role-based access control (admin, pro, business, free, guest)

#### Database Schema

**Tables**:
1. `users` - User accounts
2. `subscription_plans` - Plan definitions
3. `user_images` - Image processing history
4. `usage_tracking` - Daily usage limits
5. `analytics_events` - Event tracking
6. `analytics_page_views` - Page view tracking

---

## 🐍 Python Processing Layer

### File: `upscale_script.py` (379 lines)

**Responsibilities**:
- Load and execute AI models
- Handle image upscaling and resizing
- Manage tiling for large images
- Fallback logic when models fail

**Key Functions**:

1. **`upscale_with_realesrgan()`**
   - Executes Real-ESRGAN via subprocess
   - GPU-accelerated via Vulkan
   - 120-second timeout
   - Returns success/failure

2. **`upscale_with_tiling()`**
   - EDSR model with tiling support
   - Tile size: 256px, overlap: 16px
   - Feathered edge blending
   - Prevents RAM overflow

3. **`upscale_lite()`**
   - Fast upscaling using FSRCNN
   - Fallback to ESPCN → bicubic
   - For small images

4. **`upscale_with_espcn()`**
   - ESPCN model execution
   - Fallback to FSRCNN

5. **`upscale_image()`**
   - Main upscaling orchestrator
   - Model selection logic
   - Fallback chain handling

6. **`resize_image()`**
   - Resize by pixels or percentage
   - Maintain aspect ratio option
   - Quality control (JPEG, PNG, WebP)

**Dependencies** (`requirements.txt`):
```
opencv-python-headless
numpy
```

---

## 🔄 Request Flow

### Upscaling Request Flow

```
1. User uploads image (Frontend)
   ↓
2. POST /upscale (Express server)
   ↓
3. Authentication check (optional)
   ↓
4. Subscription tier validation
   ↓
5. Daily usage limit check
   ↓
6. File size validation
   ↓
7. Image dimension check
   ↓
8. Queue middleware (max 3 concurrent)
   ↓
9. Spawn Python process
   ↓
10. upscale_script.py executes
    ├─ Model selection (Real-ESRGAN / EDSR / FSRCNN / ESPCN)
    ├─ GPU/CPU processing
    └─ Save to processed/
   ↓
11. Upload to Cloudinary (if authenticated)
   ↓
12. Log to database (usage tracking)
   ↓
13. Return processed image
   ↓
14. Cleanup temporary files (60s delay)
```

---

## 🔐 Security Features

1. **Rate Limiting** - Prevent abuse
2. **JWT Authentication** - Secure user sessions
3. **CORS Protection** - Whitelist allowed origins
4. **File Size Limits** - Prevent DoS attacks
5. **Request Queue** - Limit concurrent processing
6. **SQL Injection Protection** - Prepared statements
7. **Password Hashing** - bcrypt
8. **Email Verification** - Prevent fake accounts

---

## 📦 Dependencies

### Backend (Node.js)
```json
{
  "express": "^5.2.1",
  "multer": "^2.0.2",
  "sharp": "^0.34.5",
  "better-sqlite3": "^12.5.0",
  "pg": "^8.16.3",
  "bcryptjs": "^3.0.3",
  "jsonwebtoken": "^9.0.3",
  "stripe": "^20.1.2",
  "cloudinary": "^2.8.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^8.2.1",
  "nodemailer": "^7.0.12",
  "uuid": "^13.0.0",
  "dotenv": "^17.2.3"
}
```

### Frontend (React)
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "tailwindcss": "^3.x",
  "vite": "^5.x"
}
```

### Python
```
opencv-python-headless
numpy
```

---

## 🚀 Deployment

### Production Environment
- **Frontend**: Vercel
- **Backend**: Render.com
- **Database**: PostgreSQL (Render)
- **Storage**: Cloudinary
- **Payments**: Stripe

### Environment Variables
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 📈 Performance Optimizations

1. **Image Size Limits**
   - 4x: max 1024px
   - 3x: max 1536px
   - 2x: max 2048px

2. **Request Queue**
   - Max 3 concurrent processes
   - Prevents server overload

3. **Tiling for Large Images**
   - EDSR uses 256px tiles
   - Prevents RAM overflow

4. **Model Selection**
   - Default: Real-ESRGAN Fast (smallest, fastest)
   - Fallback chain for reliability

5. **Cleanup Strategy**
   - Temporary files deleted after 60 seconds
   - Processed files kept for download window

---

## 🎯 Subscription Tiers

| Feature | Guest | Free | Pro | Business |
|---------|-------|------|-----|----------|
| 2x Upscale/day | 3 | 10 | 100 | Unlimited |
| 4x Upscale/day | 1 | 3 | 50 | Unlimited |
| Max File Size | 5MB | 10MB | 25MB | 100MB |
| Real-ESRGAN Pro | ❌ | ❌ | ✅ | ✅ |
| Batch Processing | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |
| Cloud Storage | ❌ | ❌ | ✅ | ✅ |

---

## 🔧 GPU Acceleration Notes

### Current Limitations
- **Render.com free tier**: No GPU available
- Real-ESRGAN falls back to CPU (10-30x slower)
- OpenCV models are CPU-only by default

### GPU Hosting Options (Future)
- Render GPU: A10G @ $0.75/hr
- Vast.ai: $0.10-0.50/hr (spot instances)
- RunPod: RTX 3090 @ $0.35/hr
- Replicate.com: Pay-per-use ($0.000225 per image)

### Local GPU Testing
```bash
cd realesrgan
realesrgan-ncnn-vulkan.exe -i input.jpg -o output.jpg -n realesr-animevideov3 -v
```
Look for `[0 NVIDIA GeForce RTX...]` to confirm GPU usage.

---

## 📝 Notes for AI Agents

1. **Model Selection Logic**: The application intelligently selects models based on subscription tier, with fallback chains for reliability.

2. **GPU Acceleration**: Only Real-ESRGAN supports GPU via Vulkan. OpenCV models require custom CUDA compilation for GPU support.

3. **Scalability**: The request queue and rate limiting prevent server overload on free hosting tiers.

4. **Database**: Uses PostgreSQL in production (Render) and SQLite in development for easy local testing.

5. **Frontend-Backend Separation**: Frontend is deployed separately on Vercel, backend on Render, communicating via REST API.

6. **Image Processing**: Python handles the heavy lifting, Node.js orchestrates requests and manages business logic.

---

**Last Updated**: February 2026
**Version**: 1.0.0
