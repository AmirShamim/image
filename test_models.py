# Test script to verify AI upscaling models are working
import cv2
from cv2 import dnn_superres
import numpy as np
import os
import time

# Create a simple test image (100x100 with gradients and patterns)
def create_test_image():
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    
    # Add gradient
    for i in range(100):
        for j in range(100):
            img[i, j] = [i * 2, j * 2, (i + j)]
    
    # Add some shapes
    cv2.rectangle(img, (20, 20), (40, 40), (255, 0, 0), -1)
    cv2.circle(img, (70, 70), 15, (0, 255, 0), -1)
    cv2.line(img, (10, 90), (90, 10), (0, 0, 255), 2)
    
    return img

# Test upscaling with different models
def test_model(model_name, model_file, scale):
    if not os.path.exists(model_file):
        print(f"  ❌ {model_file} not found!")
        return None, None
    
    sr = dnn_superres.DnnSuperResImpl_create()
    sr.readModel(model_file)
    sr.setModel(model_name, scale)
    
    # Create test image
    img = create_test_image()
    
    # Measure time
    start = time.time()
    result = sr.upsample(img)
    elapsed = time.time() - start
    
    return result, elapsed

def test_bicubic(scale):
    img = create_test_image()
    start = time.time()
    h, w = img.shape[:2]
    result = cv2.resize(img, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
    elapsed = time.time() - start
    return result, elapsed

print("=" * 60)
print("AI UPSCALING MODEL TEST")
print("=" * 60)
print(f"Test image size: 100x100 pixels")
print()

# Test bicubic first (baseline)
print("Testing BICUBIC (baseline - no AI):")
result, elapsed = test_bicubic(2)
if result is not None:
    cv2.imwrite("test_output_bicubic_2x.png", result)
    print(f"  ✅ Output: {result.shape[1]}x{result.shape[0]}, Time: {elapsed:.3f}s")
print()

# Test each model
models = [
    ("fsrcnn", "FSRCNN_x2.pb", 2),
    ("fsrcnn", "FSRCNN_x3.pb", 3),
    ("fsrcnn", "FSRCNN_x4.pb", 4),
    ("espcn", "ESPCN_x2.pb", 2),
    ("espcn", "ESPCN_x3.pb", 3),
    ("espcn", "ESPCN_x4.pb", 4),
    ("edsr", "EDSR_x2.pb", 2),
    ("edsr", "EDSR_x4.pb", 4),
]

for model_name, model_file, scale in models:
    print(f"Testing {model_name.upper()} x{scale}:")
    result, elapsed = test_model(model_name, model_file, scale)
    if result is not None:
        output_file = f"test_output_{model_name}_{scale}x.png"
        cv2.imwrite(output_file, result)
        print(f"  ✅ Output: {result.shape[1]}x{result.shape[0]}, Time: {elapsed:.3f}s")
        print(f"     Saved to: {output_file}")
    print()

# Compare outputs
print("=" * 60)
print("COMPARING OUTPUTS")
print("=" * 60)

# Load all 2x outputs and compare
files_2x = [
    ("Bicubic", "test_output_bicubic_2x.png"),
    ("FSRCNN", "test_output_fsrcnn_2x.png"),
    ("ESPCN", "test_output_espcn_2x.png"),
    ("EDSR", "test_output_edsr_2x.png"),
]

reference = None
for name, filename in files_2x:
    if os.path.exists(filename):
        img = cv2.imread(filename)
        if reference is None:
            reference = img
            print(f"{name}: Reference image")
        else:
            # Calculate difference
            diff = cv2.absdiff(reference, img)
            mean_diff = np.mean(diff)
            max_diff = np.max(diff)
            if mean_diff < 0.001:
                print(f"{name}: ⚠️  IDENTICAL to bicubic (mean diff: {mean_diff:.4f})")
            else:
                print(f"{name}: ✅ Different from bicubic (mean diff: {mean_diff:.2f}, max: {max_diff})")

print()
print("=" * 60)
print("Test complete! Check the test_output_*.png files to compare visually.")
print("=" * 60)
