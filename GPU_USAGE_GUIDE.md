# GPU Utilization for AI Upscaling Models

## Current Architecture

The ImageStudio application leverages Serverless GPUs (via Modal.com) for instantaneous, pay-per-second AI processing. 

### Why Serverless GPUs?

Traditional architectures require either:
1. **CPU Only Inference**: Extremely slow (2-3 minutes per image block), blocking Node.js event loops.
2. **Always-On GPU Servers**: Renting a server with an NVIDIA A10G or better costs $70 - $300+/month minimum, even when the app receives no traffic.

**The Solution:**
We separated the AI processing into a Serverless microservice (`gpu-provider` communicating with a remote Python app). When a user requests an upscale:
1. The Node.js application (hosted cheaply on DigitalOcean/Render) forwards the image and instructions securely to Modal.
2. An NVIDIA T4 or A10G Serverless GPU boots up, runs the upscale (Real-ESRGAN or Real-ESRGAN Anime model) in under 7 seconds, and streams the result back.
3. The instance scales down to 0 when idle. 

**This enables real-time AI image generation while maintaining an operational base cost near $0/month.**

---

## Active Models

All models deployed to our Modal backend are strictly GPU-accelerated. We no longer maintain fallback CPU models like FSRCNN or EDSR.

| Model | GPU | Typical Speed | Quality | Intended Use |
|-------|-----|---------------|---------|--------------|
| **Real-ESRGAN Pro** | T4/A10G | ~3-7 sec | Excellent | Realistic photos, general high-fidelity upscaling. Requires Pro tier. |
| **Real-ESRGAN Anime** | T4/A10G | ~3-7 sec | Excellent | Digital art and anime illustrations. Free/Guest access. |

---

## Local Development vs Production

### In Production
When `NODE_ENV=production` and `GPU_PROVIDER=modal`, the backend will stream requests securely to your defined cloud URL.
- All requests are managed by an Express queue limiting max concurrent upscale jobs (preventing runaway billing).
- Enforces strict image size limits (e.g., maximum dimensions around 2048px/2K depending on scale) before passing network traffic to the GPU instance, avoiding OOM (Out-of-Memory) errors.

### During Development
For local testing without using real Serverless compute credits, or if running offline:
1. The `gpu-provider` layer acts as an abstraction. You can configure mocked callbacks for local frontend design iteration.
2. Real GPU testing locally requires pointing to a custom development endpoint or having your local machine run the matching FastAPI Python endpoint on a local CUDA-supported card.

## Performance Optimization Checklist

1. **Pre-Filtering Constraints**: We restrict upscaling 4x to images ≤ 1024px, and 2x to ≤ 2048px. These match the safe VRAM envelopes for our chosen cloud GPUs.
2. **Concurrency Limiter**: A p-queue inside `routes/images.js` strictly caps max parallel processing tasks to 3. This matches standard Modal free-tier concurrency limits and ensures Node.js intermediate buffers do not exhaust RAM.
3. **Optimized Transfers**: Input frames are processed safely and piped securely to Cloudinary, ensuring the API instance doesn't bottleneck on disk writes.
