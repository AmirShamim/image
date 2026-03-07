# GPU Provider Architecture

This module controls how the `server.js` backend upscales images. You can seamlessly switch between processing images on your local graphics card, or deploying to a cloud serverless API without rewriting any backend code.

## 🚀 How to Switch Providers

Open your `.env` file and set the `GPU_PROVIDER` variable.

```env
# Option 1: Process on your own local GPU (Free, Great for dev)
GPU_PROVIDER=local

# Option 2: Serverless cloud (Generous free tier)
# GPU_PROVIDER=modal

# Option 3: Serverless cloud (Pay as you go)
# GPU_PROVIDER=replicate
```

Restart your backend server (`npm start`) after changing this value.

---

## 1. Local Provider (`local.js`)
*Status: **Active***

Uses the existing `realesrgan-ncnn-vulkan.exe` binary.
- Requires a Vulkan-compatible CPU/GPU on your machine.
- Free, but ties up your local machine.

---

## 2. Modal Provider (`modal.js`) 
*Status: **Stub (Needs Setup)***

[Modal.com](https://modal.com/) is a serverless GPU provider giving $30/mo in free GPU compute. 
- You only pay for the exact seconds the GPU is running. At 5 seconds per upscale, $30 gets you ~40,000 free upscales every month.

To use this:
1. Create a Modal account and install their CLI.
2. Deploy a small Python script to Modal that wraps the Real-ESRGAN package into an HTTP endpoint.
3. Add your newly generated endpoint to your `.env` file:

```env
MODAL_ENDPOINT_URL="https://your-username--realesrgan-upscale.modal.run"
MODAL_API_TOKEN="your-custom-token-if-you-set-one"
```

### Example Modal Python Script (`app.py`):
You will need to write and deploy a Modal script similar to this:
```python
import modal
import base64
from io import BytesIO

app = modal.App("realesrgan-api")

image = (
    modal.Image.debian_slim()
    .pip_install("realesrgan", "opencv-python-headless", "Pillow")
)

@app.function(image=image, gpu="T4")
@modal.web_endpoint(method="POST")
def upscale(item: dict):
    # Base64 decode input
    # Run RealESRGAN logic
    # Base64 encode output
    return {"output_image": "base64_string..."}
```

---

## 3. Replicate Provider (`replicate.js`)
*Status: **Stub (Needs Setup)***

[Replicate](https://replicate.com/) hosts open-source models ready to be called via API. 
- You do not need to deploy your own code, but there is no generous free tier.
- Costs exactly fraction of a cent per API call ($0.002 on T4 GPU).

To use this:
1. Create a Replicate account.
2. Add your API token to `.env`:

```env
REPLICATE_API_TOKEN="r8_abc123"
```
