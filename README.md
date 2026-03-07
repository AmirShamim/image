# AI Image Studio 🎨✂️

An enterprise-grade, full-stack AI image processing SaaS that allows users to upscale and resize images using state-of-the-art AI models.

## The Architecture Journey

Image Studio started as an ambitious local monolith. It ran a Node.js Express server alongside heavy Python subprocesses, utilized several physical `.pb` TensorFlow models for CPU inference (EDSR, ESPCN, FSRCNN), and bundled large pre-compiled local binaries for NCNN Vulkan GPU acceleration.

**The problem?** It was un-deployable on modern serverless or standard PaaS environments. Free/cheap hosting platforms (like Render or DigitalOcean App Platform) do not come with GPUs, cannot handle 100MB+ model payloads in Git, and running Python ML frameworks via `child_process.spawn()` inside Node.js is a nightmare for memory limits and cold starts.

### The Refactor: Splitting the Monolith

To make this project live, scalable, and cost-efficient, we performed a ruthless decoupling:

1.  **Pure Node.js Backend**: Removed **all** Python dependencies from the backend. The core server (`server.js`) only handles auth, rate-limiting, database transactions (PostgreSQL/SQLite), Stripe billing, and Cloudinary uploads. Standard image resizing was moved from OpenCV/Python to pure Node.js using `sharp`.
2.  **Serverless GPU Abstraction**: We created a `gpu-provider` abstraction layer. Instead of running Python locally, the server now acts as a proxy.
3.  **Modal Integration**: We isolated the heavy machine learning code (PyTorch, Real-ESRGAN, GFPGAN) into a single, dedicated microservice (`modal-serverless/app.py`). This runs on **Modal.com**, utilizing pay-per-second T4 GPUs.
4.  **Database Evolution**: Refactored the database layer (`database-pg.js`) to support both SQLite (for frictionless local dev) and PostgreSQL (for serverless production), switching automatically based on environment variables.

### Why We Removed the Legacy Models

During the refactor, we completely deleted the `.pb` CPU models (EDSR, ESPCN, FSRCNN) and the local `realesrgan` binary folder. **We shed almost ~100MB of dead weight.**

We didn't sugarcoat it: those legacy models were dead weight for a production SaaS. 
*   **CPU inference is dead:** Upscaling images on a standard server CPU takes minutes per image, blocking the Node event loop and providing a terrible UX.
*   **Quality:** Real-ESRGAN produces vastly superior results for the specific use-cases (anime and photography) this app targets compared to older super-resolution methods. 
*   **Cost vs. Architecture:** Maintaining a giant monolithic container that *can* run everything locally makes cloud deployment incredibly expensive. By outsourcing the heavy lifting to specialized GPU serverless infrastructure (Modal), the main backend can run on a $5/mo DigitalOcean instance or Render free tier.

**Will we add legacy models back?** Yes, but *only* through the serverless GPU microservice pattern. If we ever need EDSR or FSRCNN for specific rapid-upscale use-cases, we will deploy them as separate Modal functions, keeping the core Node.js backend lightweight and fast.

---

## Tech Stack

### Frontend
- **React.js (Vite)**
- **Tailwind CSS**
- **React Compare Slider** (for before/after viewing)

### Backend (Node.js)
- **Express.js** (API routing)
- **better-sqlite3 / pg** (Database)
- **Sharp** (Image resizing and dimension extraction)
- **JSON Web Tokens (JWT)** (Auth)
- **Stripe** (Payments & Subscription Tiers)
- **Cloudinary** (Cloud image storage)

### Machine Learning Microservice (Modal)
- **Python 3.11**
- **PyTorch (2.1.2)**
- **Real-ESRGAN & GFPGAN** (Image upscaling & face restoration)
- **FastAPI** (Internal routing for Modal endpoint)

---

## Deployment Strategy (Optimized for $200 DO Student Credits)

This architecture is deliberately designed to stretch hosting credits by relying on specialized, isolated free-tiers.

1.  **Frontend (Vercel)**: Hosted for $0/mo. Handles static routing and UI.
2.  **GPU Backend (Modal)**: Hosted on Modal.com. Gives $30/mo free compute. Since it sleeps when idle and boots in seconds, this covers thousands of upscales for free.
3.  **Database (Neon.tech)**: Hosted on Neon for $0/mo. Serverless PostgreSQL that scales to zero.
4.  **Core API (DigitalOcean App Platform)**: The *only* thing that consumes DO credits. We deploy the Node.js backend on a Basic $5/mo instance. 

**Result**: A fully scalable, GPU-accelerated SaaS that costs exactly **$5/month** to run, allowing $200 in student credits to last an incredible **40 months**.

---

## Local Development Details

If you want to run the project locally (using SQLite and bypassing Modal for pure dev work):

1.  Copy `.env.example` to `.env`
2.  Set `GPU_PROVIDER=local` (if you restore the local binaries) or keep as `modal` to test cloud ML.
3.  Run backend: `npm start`
4.  Run frontend: `cd client/vite-project && npm run dev`

*Rate limits are automatically bypassed for `127.0.0.1` and Admin users to allow frictionless testing.*
