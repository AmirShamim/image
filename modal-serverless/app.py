import modal
import base64
import os
from io import BytesIO

# Define the Modal App
app = modal.App("realesrgan-api")

# Define the environment image with PINNED compatible versions
# The basicsr/torchvision compatibility issue requires specific version pins
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("libgl1-mesa-glx", "libglib2.0-0")
    # Phase 1: Install numpy first (torch 2.1.x needs numpy <2)
    .pip_install("numpy<2")
    # Phase 2: Install torch + core deps
    .pip_install(
        "numpy<2",
        "fastapi[standard]",
        "torch==2.1.2",
        "torchvision==0.16.2",
        "opencv-python-headless==4.8.1.78",
        "Pillow",
    )
    # Phase 3: Install Real-ESRGAN stack after torch is ready
    .pip_install(
        "numpy<2",
        "basicsr==1.4.2",
        "facexlib==0.3.0",
        "gfpgan==1.3.8",
        "realesrgan==0.3.0",
    )
)


@app.function(gpu="T4", image=image, timeout=120)
@modal.web_endpoint(method="POST")
def upscale(request: dict):
    """Upscale an image using Real-ESRGAN on a T4 GPU."""
    
    # Monkey-patch the removed torchvision module BEFORE importing basicsr/realesrgan
    import importlib
    import torchvision.transforms.functional as F
    import sys
    sys.modules['torchvision.transforms.functional_tensor'] = F

    from PIL import Image
    import torch
    import cv2
    import numpy as np
    from realesrgan import RealESRGANer
    from basicsr.archs.rrdbnet_arch import RRDBNet

    try:
        # 1. Parse request
        base64_img = request.get("image", "")
        if "base64," in base64_img:
            base64_img = base64_img.split("base64,")[1]

        model_name = request.get("model", "realesrgan")
        scale = int(request.get("scale", 4))

        # 2. Decode image
        img_bytes = base64.b64decode(base64_img)
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
        img_np = np.array(img)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        # 3. Setup Model
        if model_name == "realesrgan-anime":
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=6, num_grow_ch=32, scale=4)
            netscale = 4
            file_url = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth'
        else:
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            netscale = 4
            file_url = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'

        upsampler = RealESRGANer(
            scale=netscale,
            model_path=file_url,
            model=model,
            half=True,
            tile=512,
            tile_pad=10,
            pre_pad=0
        )

        # 4. Process image
        output_img, _ = upsampler.enhance(img_bgr, outscale=scale)

        # 5. Encode output to Base64
        output_rgb = cv2.cvtColor(output_img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(output_rgb)

        buffered = BytesIO()
        pil_img.save(buffered, format="JPEG", quality=95)
        out_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        return {
            "success": True,
            "output_image": f"data:image/jpeg;base64,{out_base64}"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
