# upscale_script.py
import sys
import cv2
from cv2 import dnn_superres
import os
import json
import numpy as np
import subprocess

input_path = sys.argv[1]
output_path = sys.argv[2]
mode = sys.argv[3]  # 'upscale' or 'resize'
options = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}

# Real-ESRGAN executable path
REALESRGAN_PATH = os.path.join(os.path.dirname(__file__), 'realesrgan', 'realesrgan-ncnn-vulkan.exe')

# Model configurations
MODELS = {
    # Old OpenCV models (kept for fallback)
    'fsrcnn_2x': {'file': 'FSRCNN_x2.pb', 'name': 'fsrcnn', 'scale': 2},
    'fsrcnn_3x': {'file': 'FSRCNN_x3.pb', 'name': 'fsrcnn', 'scale': 3},
    'fsrcnn_4x': {'file': 'FSRCNN_x4.pb', 'name': 'fsrcnn', 'scale': 4},
    'espcn_2x': {'file': 'ESPCN_x2.pb', 'name': 'espcn', 'scale': 2},
    'espcn_3x': {'file': 'ESPCN_x3.pb', 'name': 'espcn', 'scale': 3},
    'espcn_4x': {'file': 'ESPCN_x4.pb', 'name': 'espcn', 'scale': 4},
    'edsr_2x': {'file': 'EDSR_x2.pb', 'name': 'edsr', 'scale': 2},
    'edsr_4x': {'file': 'EDSR_x4.pb', 'name': 'edsr', 'scale': 4},
}

# Real-ESRGAN model names
REALESRGAN_MODELS = {
    'realesrgan': 'realesrgan-x4plus',           # Best quality (32MB)
    'realesrgan-fast': 'realesr-animevideov3',   # Fast (1.2MB)
    'realesrgan-anime': 'realesrgan-x4plus-anime' # Anime/art (8.5MB)
}

def get_model_path(model_key):
    """Get model file path, checking if it exists"""
    if model_key not in MODELS:
        return None, None, None
    config = MODELS[model_key]
    model_path = config['file']
    if not os.path.exists(model_path):
        return None, None, None
    return model_path, config['name'], config['scale']

def upscale_with_realesrgan(input_path, output_path, scale=4, model_name='realesrgan-x4plus'):
    """High-quality upscaling using Real-ESRGAN (GPU accelerated)
    
    Models:
    - realesrgan-x4plus: Best quality for photos (32MB)
    - realesr-animevideov3: Fast, good for video/general (1.2MB)
    - realesrgan-x4plus-anime: Best for anime/artwork (8.5MB)
    """
    if not os.path.exists(REALESRGAN_PATH):
        print(f"Error: Real-ESRGAN not found at {REALESRGAN_PATH}", file=sys.stderr)
        return False
    
    # Build command
    cmd = [
        REALESRGAN_PATH,
        '-i', input_path,
        '-o', output_path,
        '-n', model_name,
        '-s', str(scale)
    ]
    
    print(f"Running Real-ESRGAN with model: {model_name}, scale: {scale}x", file=sys.stderr)
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            print(f"Real-ESRGAN error: {result.stderr}", file=sys.stderr)
            return False
        return True
    except subprocess.TimeoutExpired:
        print("Real-ESRGAN timed out after 120 seconds", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Real-ESRGAN exception: {str(e)}", file=sys.stderr)
        return False

def upscale_lite(image, scale=2):
    """Fast upscaling using FSRCNN (Lite mode - legacy)
    Falls back to ESPCN if FSRCNN not available, then to bicubic interpolation
    """
    sr = dnn_superres.DnnSuperResImpl_create()
    
    # Try FSRCNN first (fastest)
    model_key = f'fsrcnn_{scale}x'
    model_path, model_name, _ = get_model_path(model_key)
    
    if model_path is None:
        # Fallback to ESPCN
        model_key = f'espcn_{scale}x'
        model_path, model_name, _ = get_model_path(model_key)
    
    if model_path is None:
        # Ultimate fallback: bicubic interpolation
        print(f"Warning: No lite model found for {scale}x, using bicubic interpolation", file=sys.stderr)
        h, w = image.shape[:2]
        return cv2.resize(image, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
    
    sr.readModel(model_path)
    sr.setModel(model_name, scale)
    return sr.upsample(image)

def upscale_with_tiling(image, scale=2, tile_size=256, overlap=16):
    """High-quality upscaling using EDSR with tiling (Pro mode)
    Processes image in tiles to prevent RAM overflow on weak servers
    """
    sr = dnn_superres.DnnSuperResImpl_create()
    
    model_key = f'edsr_{scale}x'
    model_path, model_name, _ = get_model_path(model_key)
    
    if model_path is None:
        print(f"Error: EDSR model for {scale}x not found", file=sys.stderr)
        sys.exit(1)
    
    sr.readModel(model_path)
    sr.setModel(model_name, scale)
    
    h, w = image.shape[:2]
    
    # If image is small enough, process directly without tiling
    max_direct_pixels = 512 * 512  # ~262k pixels
    if h * w <= max_direct_pixels:
        return sr.upsample(image)
    
    # Calculate output dimensions
    out_h, out_w = h * scale, w * scale
    
    # Create output canvas
    result = np.zeros((out_h, out_w, 3), dtype=np.uint8)
    weight_map = np.zeros((out_h, out_w), dtype=np.float32)
    
    # Calculate step size (tile_size - overlap)
    step = tile_size - overlap
    
    # Process tiles
    for y in range(0, h, step):
        for x in range(0, w, step):
            # Calculate tile boundaries
            y_end = min(y + tile_size, h)
            x_end = min(x + tile_size, w)
            y_start = max(0, y_end - tile_size)
            x_start = max(0, x_end - tile_size)
            
            # Extract tile
            tile = image[y_start:y_end, x_start:x_end]
            
            # Upscale tile
            upscaled_tile = sr.upsample(tile)
            
            # Calculate output positions
            out_y_start = y_start * scale
            out_x_start = x_start * scale
            out_y_end = out_y_start + upscaled_tile.shape[0]
            out_x_end = out_x_start + upscaled_tile.shape[1]
            
            # Create blending weight (feather edges for smooth blending)
            tile_h, tile_w = upscaled_tile.shape[:2]
            blend_weight = np.ones((tile_h, tile_w), dtype=np.float32)
            
            # Feather the edges
            feather = overlap * scale
            if feather > 0:
                for i in range(feather):
                    weight = i / feather
                    if y_start > 0:
                        blend_weight[i, :] *= weight
                    if y_end < h:
                        blend_weight[tile_h - 1 - i, :] *= weight
                    if x_start > 0:
                        blend_weight[:, i] *= weight
                    if x_end < w:
                        blend_weight[:, tile_w - 1 - i] *= weight
            
            # Add to result with blending
            for c in range(3):
                result[out_y_start:out_y_end, out_x_start:out_x_end, c] = (
                    result[out_y_start:out_y_end, out_x_start:out_x_end, c] * 
                    (1 - blend_weight / (weight_map[out_y_start:out_y_end, out_x_start:out_x_end] + blend_weight + 1e-8)) +
                    upscaled_tile[:, :, c] * blend_weight / (weight_map[out_y_start:out_y_end, out_x_start:out_x_end] + blend_weight + 1e-8)
                ).astype(np.uint8)
            
            weight_map[out_y_start:out_y_end, out_x_start:out_x_end] += blend_weight
    
    return result

def upscale_with_espcn(image, scale=2):
    """Upscaling using ESPCN model"""
    sr = dnn_superres.DnnSuperResImpl_create()
    
    model_key = f'espcn_{scale}x'
    model_path, model_name, _ = get_model_path(model_key)
    
    if model_path is None:
        # Fallback to FSRCNN
        return upscale_lite(image, scale)
    
    sr.readModel(model_path)
    sr.setModel(model_name, scale)
    return sr.upsample(image)

def upscale_image(input_path, output_path, options):
    """Upscale image using selected model type"""
    scale_str = options.get('model', '2x')
    scale = int(scale_str.replace('x', ''))
    model_type = options.get('modelType', 'realesrgan-fast')  # Default to Real-ESRGAN fast
    tier = options.get('tier', 'free')  # 'free', 'pro', 'business'
    
    image = cv2.imread(input_path)
    if image is None:
        print("Error: Could not read image", file=sys.stderr)
        sys.exit(1)
    
    h, w = image.shape[:2]
    print(f"Input image: {w}x{h}", file=sys.stderr)
    
    # Select model based on modelType parameter
    if model_type == 'realesrgan':
        # Real-ESRGAN - Best quality (Pro users) - only supports 4x
        print(f"Using Real-ESRGAN (Best Quality) for {scale}x upscale", file=sys.stderr)
        # realesrgan-x4plus only supports 4x, so we upscale to 4x and resize if needed
        success = upscale_with_realesrgan(input_path, output_path, 4, 'realesrgan-x4plus')
        if success:
            result = cv2.imread(output_path)
            # If user requested 2x, resize the 4x result down to 2x
            if scale == 2:
                h_out, w_out = result.shape[:2]
                result = cv2.resize(result, (w_out // 2, h_out // 2), interpolation=cv2.INTER_AREA)
                cv2.imwrite(output_path, result)
            model_used = 'realesrgan'
        else:
            # Fallback to EDSR
            print("Falling back to EDSR...", file=sys.stderr)
            result = upscale_with_tiling(image, scale)
            cv2.imwrite(output_path, result)
            model_used = 'edsr'
    
    elif model_type == 'realesrgan-fast':
        # Real-ESRGAN Fast - Good quality, fast (Free users)
        print(f"Using Real-ESRGAN Fast for {scale}x upscale", file=sys.stderr)
        success = upscale_with_realesrgan(input_path, output_path, scale, f'realesr-animevideov3-x{scale}')
        if success:
            result = cv2.imread(output_path)
            model_used = 'realesrgan-fast'
        else:
            # Fallback to Lanczos (better than FSRCNN)
            print("Falling back to Lanczos interpolation...", file=sys.stderr)
            result = cv2.resize(image, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)
            cv2.imwrite(output_path, result)
            model_used = 'lanczos'
    
    elif model_type == 'realesrgan-anime':
        # Real-ESRGAN Anime - Best for anime/art
        print(f"Using Real-ESRGAN Anime for {scale}x upscale", file=sys.stderr)
        success = upscale_with_realesrgan(input_path, output_path, 4, 'realesrgan-x4plus-anime')
        if success:
            result = cv2.imread(output_path)
            # If scale is 2x, resize down
            if scale == 2:
                h_out, w_out = result.shape[:2]
                result = cv2.resize(result, (w_out // 2, h_out // 2), interpolation=cv2.INTER_AREA)
                cv2.imwrite(output_path, result)
            model_used = 'realesrgan-anime'
        else:
            result = upscale_with_tiling(image, scale)
            cv2.imwrite(output_path, result)
            model_used = 'edsr'
    
    elif model_type == 'edsr':
        # EDSR - Legacy high quality
        print(f"Using EDSR (Legacy) for {scale}x upscale", file=sys.stderr)
        result = upscale_with_tiling(image, scale)
        cv2.imwrite(output_path, result)
        model_used = 'edsr'
    
    else:
        # Default: Use Real-ESRGAN Fast for best results
        print(f"Using Real-ESRGAN Fast (default) for {scale}x upscale", file=sys.stderr)
        success = upscale_with_realesrgan(input_path, output_path, scale, f'realesr-animevideov3-x{scale}')
        if success:
            result = cv2.imread(output_path)
            model_used = 'realesrgan-fast'
        else:
            result = cv2.resize(image, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)
            cv2.imwrite(output_path, result)
            model_used = 'lanczos'
    
    # Return info about the result
    out_h, out_w = result.shape[:2]
    print(json.dumps({
        "width": out_w, 
        "height": out_h, 
        "scale": scale,
        "model": model_used,
        "tier": tier
    }))

def resize_image(input_path, output_path, options):
    """Resize image by pixels or percentage"""
    image = cv2.imread(input_path)
    if image is None:
        print("Error: Could not read image", file=sys.stderr)
        sys.exit(1)
    
    original_h, original_w = image.shape[:2]
    
    resize_type = options.get('resizeType', 'percentage')
    maintain_aspect = options.get('maintainAspect', True)
    
    if resize_type == 'percentage':
        percentage = options.get('percentage', 100)
        new_w = int(original_w * percentage / 100)
        new_h = int(original_h * percentage / 100)
    else:  # pixels
        new_w = options.get('width', original_w)
        new_h = options.get('height', original_h)
        
        if maintain_aspect:
            # Calculate aspect ratio and adjust
            aspect = original_w / original_h
            if new_w / new_h > aspect:
                new_w = int(new_h * aspect)
            else:
                new_h = int(new_w / aspect)
    
    # Ensure minimum dimensions
    new_w = max(1, new_w)
    new_h = max(1, new_h)
    
    # Choose interpolation method based on scaling direction
    if new_w < original_w or new_h < original_h:
        interpolation = cv2.INTER_AREA  # Better for shrinking
    else:
        interpolation = cv2.INTER_CUBIC  # Better for enlarging
    
    result = cv2.resize(image, (new_w, new_h), interpolation=interpolation)
    
    # Get quality setting
    quality = options.get('quality', 90)
    
    # Determine output format from extension
    ext = os.path.splitext(output_path)[1].lower()
    if ext in ['.jpg', '.jpeg']:
        cv2.imwrite(output_path, result, [cv2.IMWRITE_JPEG_QUALITY, quality])
    elif ext == '.png':
        compression = int((100 - quality) / 10)  # Convert quality to PNG compression (0-9)
        cv2.imwrite(output_path, result, [cv2.IMWRITE_PNG_COMPRESSION, compression])
    elif ext == '.webp':
        cv2.imwrite(output_path, result, [cv2.IMWRITE_WEBP_QUALITY, quality])
    else:
        cv2.imwrite(output_path, result)
    
    print(json.dumps({
        "width": new_w, 
        "height": new_h,
        "originalWidth": original_w,
        "originalHeight": original_h
    }))

try:
    if mode == 'upscale':
        upscale_image(input_path, output_path, options)
    elif mode == 'resize':
        resize_image(input_path, output_path, options)
    else:
        print(f"Unknown mode: {mode}", file=sys.stderr)
        sys.exit(1)
    
    print("Done", file=sys.stderr)

except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)