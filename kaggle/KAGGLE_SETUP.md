# Kaggle Benchmark Setup Guide — ImageStudio Upscaling

## Quick Start (5 minutes)

### Step 1: Create a Kaggle Notebook

1. Go to [kaggle.com/code](https://www.kaggle.com/code)
2. Click **"+ New Notebook"**

### Step 2: Configure the Environment

In the right sidebar, set these **exactly**:

| Setting | Value | Why |
|---------|-------|-----|
| **Accelerator** | `GPU T4 x2` or `GPU P100` | Real-ESRGAN needs a CUDA GPU |
| **Internet** | `On` | Downloads models + pip packages |
| **Persistence** | `Files only` | Keeps output CSVs across sessions |
| **Language** | `Python` | Default |
| **Environment** | `Pin to latest` | Ensures latest PyTorch + CUDA |

> ⚠️ **You get ~30 hrs/week of free GPU on Kaggle.** This benchmark takes **~20-40 minutes** depending on GPU type.

### Step 3: Upload & Run

**Option A — Single cell (easiest):**

1. In the first code cell, paste:
   ```python
   !wget -q https://raw.githubusercontent.com/YOUR_USERNAME/image-resizer/main/kaggle/benchmark.py
   !python benchmark.py
   ```

**Option B — Upload file:**

1. Click **"Add Data"** → **"Upload"** → select `benchmark.py`
2. In a code cell, run:
   ```python
   !cp /kaggle/input/benchmark/benchmark.py /kaggle/working/
   !python /kaggle/working/benchmark.py
   ```

**Option C — Paste directly:**

1. Copy the entire contents of `benchmark.py`
2. Paste into a Kaggle code cell
3. Run the cell

### Step 4: Collect Results

After the benchmark completes, two files appear in `/kaggle/working/`:

| File | Description |
|------|-------------|
| `benchmark_results.csv` | Raw data — every run with CPU/GPU/RAM/time |
| `benchmark_summary.txt` | Pretty table + GPU rental recommendations |

Download them from the **Output** tab on the right sidebar.

---

## What Gets Benchmarked

### Real-ESRGAN Models (GPU-accelerated via PyTorch + CUDA)

| Model | Description | Scales | Your Usage |
|-------|-------------|--------|------------|
| `realesrgan-x4plus` | Best photo quality (23 RRDB blocks, 32MB) | 4x | Pro tier |
| `realesr-animevideov3` | Fast general purpose (6 blocks, 1.2MB) | 2x, 3x, 4x | Free tier default |
| `realesrgan-x4plus-anime` | Best for anime/art (6 blocks, 8.5MB) | 4x | Anime mode |

### Legacy OpenCV DNN Models (CPU-only)

| Model | Description | Scales | Your Usage |
|-------|-------------|--------|------------|
| `FSRCNN` | Fastest legacy model | 2x, 3x, 4x | Lite/fallback |
| `ESPCN` | Sub-pixel convolution | 2x, 3x, 4x | Secondary fallback |
| `EDSR` | Highest quality legacy (CPU tiling) | 2x, 4x | Legacy pro mode |

### Test Image Sizes

| Size | Pixels | Simulates |
|------|--------|-----------|
| 512×512 | 262K | Mobile photos, thumbnails |
| 1024×1024 | 1M | Standard web images |
| 2048×2048 | 4.2M | High-res photos |

> EDSR at 2048×2048 is **automatically skipped** (would take >10 min on CPU).

---

## What Gets Measured

For each `(model × scale × image_size)` combination:

| Metric | How | Unit |
|--------|-----|------|
| **Processing time** | `time.perf_counter()` wall clock | seconds |
| **CPU usage (avg/peak)** | `psutil.Process.cpu_percent()` sampled at 150ms | % |
| **RAM usage (avg/peak)** | `psutil.Process.memory_info().rss` | MB |
| **GPU utilization (avg/peak)** | `pynvml` NVML queries | % |
| **GPU VRAM (avg/peak)** | `pynvml` memory info | MB |

Each combo runs **2 times** (configurable via `REPEAT` constant) for stable averages.

---

## Understanding the Results

### Sample Output Table

```
┌───────────────────────────┬───────┬──────────┬──────────┬─────────┬─────────┬──────────┬─────────────┬─────────┬──────────┬─────────────┐
│ Model                     │ Scale │ Input    │ Output   │ Time(s) │ CPU Avg%│ CPU Peak%│ RAM Peak(MB)│ GPU Avg%│ GPU Peak%│ VRAM Peak(MB│
├───────────────────────────┼───────┼──────────┼──────────┼─────────┼─────────┼──────────┼─────────────┼─────────┼──────────┼─────────────┤
│ realesrgan-x4plus         │ 4x    │ 512x512  │ 2048x2048│ 3.21    │ 45.2    │ 78.0     │ 1842.3      │ 82.5    │ 97.0     │ 3215.4      │
│ realesr-animevideov3      │ 2x    │ 512x512  │ 1024x1024│ 0.85    │ 32.1    │ 55.0     │ 892.1       │ 65.3    │ 88.0     │ 1024.8      │
│ fsrcnn                    │ 2x    │ 512x512  │ 1024x1024│ 0.42    │ 98.5    │ 100.0    │ 456.2       │ 0.0     │ 0.0      │ 0.0         │
└───────────────────────────┴───────┴──────────┴──────────┴─────────┴─────────┴──────────┴─────────────┴─────────┴──────────┴─────────────┘
```

### Key Things to Look For

1. **VRAM Peak(MB)** — The #1 factor for choosing a GPU.  
   - If peak is ≤4 GB → cheapest GPUs work  
   - If peak is 4–12 GB → mid-range GPUs needed  
   - If peak is >12 GB → need RTX 3090/A10G class

2. **GPU Peak%** — If consistently near 100%, the GPU is the bottleneck (good — you're utilizing it fully).

3. **CPU Peak%** — Legacy models (FSRCNN/ESPCN/EDSR) will show ~100% CPU and 0% GPU.

4. **Time(s)** — Compare Real-ESRGAN vs legacy to see the GPU speed advantage.

---

## GPU Rental Cost Comparison

Based on typical benchmark results from ImageStudio models:

### Cheapest Options (< $0.50/hr)

| Provider | GPU | VRAM | $/hr | $/mo (24×7) | Best For |
|----------|-----|------|------|-------------|----------|
| **Vast.ai** (spot) | RTX 3060 | 12 GB | $0.10–0.15 | $73–110 | Lowest cost, variable |
| **Vast.ai** (spot) | RTX 3090 | 24 GB | $0.20–0.35 | $146–255 | Best value high-VRAM |
| **RunPod** (spot) | RTX 3090 | 24 GB | $0.22 | $161 | Reliable spot pricing |
| **RunPod** (on-demand) | RTX A4000 | 16 GB | $0.36 | $263 | Reliable, good VRAM |
| **Google Cloud** | T4 | 16 GB | $0.35 | $255 | Enterprise reliability |
| **Kaggle** | T4 | 16 GB | FREE | FREE | 30 hrs/week limit |
| **Colab Pro** | T4/V100 | 16 GB | $0.01 | $10/mo flat | Notebook format |

### Serverless GPU (Pay-per-image, best for low volume)

| Provider | GPU | Cost/image | Best For |
|----------|-----|-----------|----------|
| **Replicate** | A40 | ~$0.0002–0.001 | <500 images/day |
| **Modal** | T4/A10G | ~$0.0001–0.0005 | Scale-to-zero |
| **Banana.dev** | Various | ~$0.0003 | Simple API |
| **Salad** | Consumer GPUs | ~$0.0001 | Cheapest serverless |

### Decision Matrix

| Daily Images | Recommended | Approx Monthly Cost |
|-------------|-------------|-------------------|
| < 50 | Serverless (Modal/Replicate) | $0.30–3 |
| 50–500 | Spot GPU (Vast.ai RTX 3060) | $10–30 |
| 500–5,000 | On-demand GPU (RunPod RTX 3090) | $50–160 |
| 5,000+ | Dedicated GPU (2× RTX 3090) | $200–500 |

---

## Customizing the Benchmark

### Change image sizes

Edit the `IMAGE_SIZES` list in `benchmark.py`:

```python
IMAGE_SIZES = [
    (512, 512),
    (1024, 1024),
    (2048, 2048),
    (4096, 4096),   # Add 4K test (needs more VRAM!)
]
```

### Change repeat count

```python
REPEAT = 3   # More repeats = more stable averages, but slower
```

### Enable Real-ESRGAN tiling (lower VRAM usage)

In the `_build_realesrgan` function, change `tile=0` to a tile size:

```python
upsampler = RealESRGANer(
    ...
    tile=256,       # Process in 256px tiles (lower VRAM, slightly slower)
    tile_pad=10,
    ...
)
```

This is useful if you want to test whether tiling lets you use a cheaper GPU.

### Use your own test images

Replace the `_make_test_image()` calls with your own images:

```python
# In run_benchmarks(), replace the test image generation with:
test_images = {
    "photo1": Path("/kaggle/input/your-dataset/photo.jpg"),
    "photo2": Path("/kaggle/input/your-dataset/portrait.jpg"),
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `CUDA not available` | Ensure Accelerator is set to GPU in notebook settings |
| `Internet disabled` | Turn on Internet in Settings → Internet → On |
| `Out of memory` | Reduce `IMAGE_SIZES` or enable tiling (`tile=256`) |
| `Model download fails` | Re-run the cell — Kaggle network can be flaky |
| `Import error: basicsr` | The script auto-installs deps; wait for it to finish |
| `Very slow on FSRCNN/ESPCN` | Expected — these are CPU-only models, not GPU-accelerated |
| `EDSR skipped at 2048` | Intentional — EDSR at 2048×2048 takes >10 min on CPU |

---

## After the Benchmark

1. **Download** `benchmark_results.csv` and `benchmark_summary.txt`
2. **Check VRAM Peak** — this determines your minimum GPU
3. **Check the recommendations** at the bottom of the summary file
4. **Pick a provider** from the cost table above
5. When deploying, use the same Real-ESRGAN Python package (not the ncnn-vulkan binary) for proper CUDA GPU acceleration

### Migrating from ncnn-vulkan to PyTorch

Your current production uses `realesrgan-ncnn-vulkan.exe` (Windows Vulkan binary). For GPU cloud deployment (Linux + CUDA), switch to the Python `realesrgan` package used in this benchmark — it's the same models with better CUDA performance. The benchmark script shows exactly how to initialize each model.
