# upscale_script.py
import sys
import cv2
from cv2 import dnn_superres
import os
import json

input_path = sys.argv[1]
output_path = sys.argv[2]
mode = sys.argv[3]  # 'upscale' or 'resize'
options = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}

def upscale_image(input_path, output_path):
    """Upscale image using EDSR model (4x)"""
    model_path = "EDSR_x4.pb"
    
    if not os.path.exists(model_path):
        print(f"Error: Model file {model_path} not found", file=sys.stderr)
        sys.exit(1)
    
    sr = dnn_superres.DnnSuperResImpl_create()
    sr.readModel(model_path)
    sr.setModel("edsr", 4)
    
    image = cv2.imread(input_path)
    if image is None:
        print("Error: Could not read image", file=sys.stderr)
        sys.exit(1)
    
    result = sr.upsample(image)
    cv2.imwrite(output_path, result)
    
    # Return info about the result
    h, w = result.shape[:2]
    print(json.dumps({"width": w, "height": h}))

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
        upscale_image(input_path, output_path)
    elif mode == 'resize':
        resize_image(input_path, output_path, options)
    else:
        print(f"Unknown mode: {mode}", file=sys.stderr)
        sys.exit(1)
    
    print("Done", file=sys.stderr)

except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)