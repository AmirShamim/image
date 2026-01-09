# Real-world test: Compare AI upscaling vs simple resize
import cv2
from cv2 import dnn_superres
import numpy as np
import os

print("=" * 70)
print("REAL-WORLD UPSCALING COMPARISON")
print("=" * 70)

# Create a realistic low-res test image with text and details
def create_realistic_test():
    # Start with a larger image and shrink it (simulates low-res photo)
    big = np.zeros((400, 400, 3), dtype=np.uint8)
    
    # Add gradient background
    for i in range(400):
        for j in range(400):
            big[i, j] = [50 + i//4, 30 + j//4, 80]
    
    # Add text (this is where AI upscaling shines - edge preservation)
    cv2.putText(big, "HELLO", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 3, (255, 255, 255), 4)
    cv2.putText(big, "World!", (80, 320), cv2.FONT_HERSHEY_SIMPLEX, 2.5, (200, 200, 255), 3)
    
    # Add shapes with edges
    cv2.rectangle(big, (300, 50), (380, 130), (0, 200, 255), -1)
    cv2.circle(big, (340, 300), 50, (255, 100, 100), -1)
    
    # Add fine details (lines)
    for i in range(10, 100, 10):
        cv2.line(big, (10, i), (100, i), (255, 255, 255), 1)
    
    # Shrink to simulate low-res (this loses quality)
    small = cv2.resize(big, (100, 100), interpolation=cv2.INTER_AREA)
    
    return small, big

# Create test images
print("\n1. Creating test image...")
low_res, original_big = create_realistic_test()
cv2.imwrite("comparison_0_original_lowres.png", low_res)
cv2.imwrite("comparison_0_original_highres.png", original_big)
print(f"   Low-res: 100x100 pixels (saved: comparison_0_original_lowres.png)")
print(f"   Original: 400x400 pixels (saved: comparison_0_original_highres.png)")

# Method 1: Simple INTER_LINEAR (fastest, worst quality)
print("\n2. Upscaling with INTER_LINEAR (basic)...")
linear = cv2.resize(low_res, (400, 400), interpolation=cv2.INTER_LINEAR)
cv2.imwrite("comparison_1_linear.png", linear)
print("   Saved: comparison_1_linear.png")

# Method 2: INTER_CUBIC (better but still blurry)
print("\n3. Upscaling with INTER_CUBIC (better basic)...")
cubic = cv2.resize(low_res, (400, 400), interpolation=cv2.INTER_CUBIC)
cv2.imwrite("comparison_2_cubic.png", cubic)
print("   Saved: comparison_2_cubic.png")

# Method 3: INTER_LANCZOS4 (best non-AI)
print("\n4. Upscaling with INTER_LANCZOS4 (best non-AI)...")
lanczos = cv2.resize(low_res, (400, 400), interpolation=cv2.INTER_LANCZOS4)
cv2.imwrite("comparison_3_lanczos.png", lanczos)
print("   Saved: comparison_3_lanczos.png")

# Method 4: FSRCNN (AI - fast)
print("\n5. Upscaling with FSRCNN (AI - fast)...")
sr = dnn_superres.DnnSuperResImpl_create()
sr.readModel("FSRCNN_x4.pb")
sr.setModel("fsrcnn", 4)
fsrcnn = sr.upsample(low_res)
cv2.imwrite("comparison_4_fsrcnn.png", fsrcnn)
print("   Saved: comparison_4_fsrcnn.png")

# Method 5: ESPCN (AI - balanced)
print("\n6. Upscaling with ESPCN (AI - balanced)...")
sr2 = dnn_superres.DnnSuperResImpl_create()
sr2.readModel("ESPCN_x4.pb")
sr2.setModel("espcn", 4)
espcn = sr2.upsample(low_res)
cv2.imwrite("comparison_5_espcn.png", espcn)
print("   Saved: comparison_5_espcn.png")

# Method 6: EDSR (AI - best quality)
print("\n7. Upscaling with EDSR (AI - best quality)... (this takes ~10s)")
sr3 = dnn_superres.DnnSuperResImpl_create()
sr3.readModel("EDSR_x4.pb")
sr3.setModel("edsr", 4)
edsr = sr3.upsample(low_res)
cv2.imwrite("comparison_6_edsr.png", edsr)
print("   Saved: comparison_6_edsr.png")

# Calculate quality metrics (PSNR - higher is better)
print("\n" + "=" * 70)
print("QUALITY COMPARISON (PSNR - higher is better)")
print("=" * 70)

def calc_psnr(img1, img2):
    mse = np.mean((img1.astype(float) - img2.astype(float)) ** 2)
    if mse == 0:
        return float('inf')
    return 20 * np.log10(255.0 / np.sqrt(mse))

print(f"\nComparing to original 400x400 image:")
print(f"  INTER_LINEAR:  PSNR = {calc_psnr(original_big, linear):.2f} dB")
print(f"  INTER_CUBIC:   PSNR = {calc_psnr(original_big, cubic):.2f} dB")
print(f"  INTER_LANCZOS: PSNR = {calc_psnr(original_big, lanczos):.2f} dB")
print(f"  FSRCNN (AI):   PSNR = {calc_psnr(original_big, fsrcnn):.2f} dB")
print(f"  ESPCN (AI):    PSNR = {calc_psnr(original_big, espcn):.2f} dB")
print(f"  EDSR (AI):     PSNR = {calc_psnr(original_big, edsr):.2f} dB")

print("\n" + "=" * 70)
print("VISUAL COMPARISON")
print("=" * 70)
print("""
Look at the output files side by side:
- comparison_0_original_lowres.png  -> The input (100x100)
- comparison_0_original_highres.png -> What we want to recover (400x400)
- comparison_1_linear.png           -> Basic resize (blurry)
- comparison_2_cubic.png            -> Better resize (still blurry)
- comparison_3_lanczos.png          -> Best non-AI (edges are sharper)
- comparison_4_fsrcnn.png           -> AI (fast, good edges)
- comparison_5_espcn.png            -> AI (balanced)
- comparison_6_edsr.png             -> AI (best quality, sharpest)

The AI models should show:
✓ Sharper text edges
✓ Less blur around shapes
✓ Better color preservation
✓ Reduced pixelation

NOTE: AI cannot invent details that never existed!
""")
