#!/usr/bin/env python3
"""
=============================================================================
  ImageStudio Upscaling Benchmark — GPU / CPU / RAM Profiler
=============================================================================
  Designed to run on Kaggle Notebooks (T4 / P100 GPU).
  Benchmarks every model used by the ImageStudio project:
    • Real-ESRGAN  (realesrgan-x4plus, realesr-animevideov3, realesrgan-x4plus-anime)
    • Legacy OpenCV DNN  (FSRCNN, ESPCN, EDSR)
  
  Measures:
    CPU %, GPU %, GPU VRAM (MB), RAM (MB), processing time, throughput.
  
  Outputs:
    • Pretty table in stdout
    • benchmark_results.csv  — raw numbers
    • benchmark_summary.txt  — GPU rental recommendations

  Usage (Kaggle):
    1. Enable GPU accelerator  (Settings → Accelerator → GPU T4 x2 or P100)
    2. Enable Internet          (Settings → Internet → On)
    3. Upload this file or paste into a Code cell
    4. Run:  !python benchmark.py
=============================================================================
"""

# ─── 0. Dependency installer (safe for Kaggle) ──────────────────────────────
import subprocess, sys, importlib

def _install(packages: list[str]):
    """pip-install only what's missing."""
    for pkg in packages:
        mod = pkg.split("==")[0].replace("-", "_")
        try:
            importlib.import_module(mod)
        except ImportError:
            print(f"[setup] Installing {pkg} …")
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", "-q", pkg],
                stdout=subprocess.DEVNULL,
            )

_install([
    "realesrgan",
    "basicsr",
    "gfpgan",
    "opencv-contrib-python-headless",
    "psutil",
    "GPUtil",
    "pynvml",
    "tabulate",
    "numpy",
    "Pillow",
    "torch==2.8.0",
    "torchvision==0.17.0",
    "scipy",
])

# ─ Monkeypatch: fix torchvision import issue before realesrgan loads ─────────
import sys
from unittest.mock import MagicMock

# Mock the problematic module
sys.modules['torchvision.transforms.functional_tensor'] = MagicMock(rgb_to_grayscale=MagicMock())

# Force reimport by clearing caches
if 'basicsr' in sys.modules:
    del sys.modules['basicsr']
if 'realesrgan' in sys.modules:
    del sys.modules['realesrgan']

# ─── 1. Imports ──────────────────────────────────────────────────────────────
import os
import time
import csv
import json
import threading
import warnings
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import psutil
import torch
from PIL import Image
from tabulate import tabulate

# GPU monitoring
try:
    import pynvml
    pynvml.nvmlInit()
    _NVML = True
except Exception:
    _NVML = False

try:
    import GPUtil
    _GPUTIL = True
except ImportError:
    _GPUTIL = False

# Real-ESRGAN
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer

# OpenCV DNN Super Resolution
from cv2 import dnn_superres

warnings.filterwarnings("ignore")

# ─── 2. Configuration ────────────────────────────────────────────────────────
# Test image sizes (width × height)
IMAGE_SIZES = [
    (512, 512),
    (1024, 1024),
    (2048, 2048),
]

# How many times to repeat each (model × size) pair for stable averages
REPEAT = 2

# Sampling interval for the background resource monitor (seconds)
SAMPLE_INTERVAL = 0.15

# Where to store temp images and results
WORK_DIR = Path("/kaggle/working/benchmark_workspace")
RESULTS_DIR = Path("/kaggle/working")

# Legacy OpenCV model URLs  (hosted by OpenCV)
LEGACY_MODEL_URLS = {
    "FSRCNN_x2.pb":  "https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x2.pb",
    "FSRCNN_x3.pb":  "https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x3.pb",
    "FSRCNN_x4.pb":  "https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x4.pb",
    "ESPCN_x2.pb":   "https://raw.githubusercontent.com/fannymonori/TF-ESPCN/master/export/ESPCN_x2.pb",
    "ESPCN_x3.pb":   "https://raw.githubusercontent.com/fannymonori/TF-ESPCN/master/export/ESPCN_x3.pb",
    "ESPCN_x4.pb":   "https://raw.githubusercontent.com/fannymonori/TF-ESPCN/master/export/ESPCN_x4.pb",
    "EDSR_x2.pb":    "https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x2.pb",
    "EDSR_x4.pb":    "https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x4.pb",
}

# ─── 3. Helper: generate synthetic test images ──────────────────────────────
def _make_test_image(width: int, height: int, path: Path):
    """Create a realistic-ish test image with gradients, noise, and shapes."""
    rng = np.random.default_rng(42)
    img = np.zeros((height, width, 3), dtype=np.uint8)

    # Gradient background
    for c in range(3):
        grad = np.linspace(30, 220, width, dtype=np.uint8)
        img[:, :, c] = np.tile(grad, (height, 1))

    # Add Gaussian noise
    noise = rng.integers(0, 30, (height, width, 3), dtype=np.uint8)
    img = cv2.add(img, noise)

    # Draw some shapes for edge / texture diversity
    cv2.rectangle(img, (width // 8, height // 8), (width * 3 // 4, height * 3 // 4), (0, 180, 255), 3)
    cv2.circle(img, (width // 2, height // 2), min(width, height) // 4, (255, 100, 50), 2)
    cv2.putText(img, "Benchmark", (width // 6, height // 2),
                cv2.FONT_HERSHEY_SIMPLEX, max(0.5, width / 800), (255, 255, 255), 2)

    cv2.imwrite(str(path), img)
    return path


# ─── 4. Resource Monitor (background thread) ─────────────────────────────────
@dataclass
class ResourceSnapshot:
    cpu_percent: float = 0.0
    ram_mb: float = 0.0
    gpu_util: float = 0.0
    gpu_mem_mb: float = 0.0


class ResourceMonitor:
    """Samples CPU / RAM / GPU in a background thread while a model runs."""

    def __init__(self, interval: float = SAMPLE_INTERVAL):
        self.interval = interval
        self._samples: list[ResourceSnapshot] = []
        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._process = psutil.Process(os.getpid())

    # -- GPU helpers -----------------------------------------------------------
    @staticmethod
    def _gpu_util_and_mem() -> tuple[float, float]:
        """Return (gpu_utilization%, gpu_mem_used_MB)."""
        util, mem = 0.0, 0.0
        if _NVML:
            try:
                handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                info = pynvml.nvmlDeviceGetUtilizationRates(handle)
                mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                util = float(info.gpu)
                mem = mem_info.used / (1024 ** 2)
            except Exception:
                pass
        elif _GPUTIL:
            try:
                gpus = GPUtil.getGPUs()
                if gpus:
                    util = gpus[0].load * 100
                    mem = gpus[0].memoryUsed
            except Exception:
                pass
        return util, mem

    # -- Sampling loop ---------------------------------------------------------
    def _sample_loop(self):
        while not self._stop.is_set():
            cpu = self._process.cpu_percent(interval=None)
            ram = self._process.memory_info().rss / (1024 ** 2)
            gpu_u, gpu_m = self._gpu_util_and_mem()
            self._samples.append(ResourceSnapshot(cpu, ram, gpu_u, gpu_m))
            self._stop.wait(self.interval)

    # -- Public API ------------------------------------------------------------
    def start(self):
        self._samples.clear()
        self._stop.clear()
        # Prime cpu_percent so first sample isn't 0
        self._process.cpu_percent(interval=None)
        self._thread = threading.Thread(target=self._sample_loop, daemon=True)
        self._thread.start()

    def stop(self) -> list[ResourceSnapshot]:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=3)
        return self._samples

    def summary(self) -> dict:
        """Aggregate peak & average for each metric."""
        if not self._samples:
            return {k: 0.0 for k in
                    ["cpu_avg", "cpu_peak", "ram_avg_mb", "ram_peak_mb",
                     "gpu_avg", "gpu_peak", "vram_avg_mb", "vram_peak_mb"]}
        cpus = [s.cpu_percent for s in self._samples]
        rams = [s.ram_mb for s in self._samples]
        gpus = [s.gpu_util for s in self._samples]
        vram = [s.gpu_mem_mb for s in self._samples]
        return {
            "cpu_avg":     round(sum(cpus) / len(cpus), 1),
            "cpu_peak":    round(max(cpus), 1),
            "ram_avg_mb":  round(sum(rams) / len(rams), 1),
            "ram_peak_mb": round(max(rams), 1),
            "gpu_avg":     round(sum(gpus) / len(gpus), 1),
            "gpu_peak":    round(max(gpus), 1),
            "vram_avg_mb": round(sum(vram) / len(vram), 1),
            "vram_peak_mb":round(max(vram), 1),
        }


# ─── 5. Model Runners ────────────────────────────────────────────────────────

# 5a.  Real-ESRGAN models (GPU via PyTorch CUDA) ..............................

def _build_realesrgan(model_name: str, scale: int) -> RealESRGANer:
    """Construct a RealESRGANer instance for the requested model."""
    half = torch.cuda.is_available()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if model_name == "realesrgan-x4plus":
        net = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64,
                      num_block=23, num_grow_ch=32, scale=4)
        url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
        netscale = 4
    elif model_name == "realesr-animevideov3":
        from basicsr.archs.rrdbnet_arch import RRDBNet as _RRDBNet   # same class, different params
        net = _RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64,
                       num_block=6, num_grow_ch=32, scale=scale)
        url_map = {
            2: "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-animevideov3.pth",
            3: "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-animevideov3.pth",
            4: "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-animevideov3.pth",
        }
        url = url_map[scale]
        netscale = scale
    elif model_name == "realesrgan-x4plus-anime":
        net = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64,
                      num_block=6, num_grow_ch=32, scale=4)
        url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth"
        netscale = 4
    else:
        raise ValueError(f"Unknown Real-ESRGAN model: {model_name}")

    upsampler = RealESRGANer(
        scale=netscale,
        model_path=url,        # auto-downloads on first use
        model=net,
        tile=0,                # 0 = no tiling (full quality, more VRAM)
        tile_pad=10,
        pre_pad=0,
        half=half,
        device=device,
    )
    return upsampler


def run_realesrgan(input_path: str, output_path: str,
                   model_name: str, scale: int) -> bool:
    """Run Real-ESRGAN upscaling.  Returns True on success."""
    try:
        upsampler = _build_realesrgan(model_name, scale)
        img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            return False

        output, _ = upsampler.enhance(img, outscale=scale)
        cv2.imwrite(output_path, output)

        # Free VRAM immediately
        del upsampler
        torch.cuda.empty_cache()
        return True
    except Exception as e:
        print(f"  [!] Real-ESRGAN error ({model_name}): {e}")
        return False


# 5b.  Legacy OpenCV DNN models (CPU only) ....................................

def _download_legacy_models(dest: Path):
    """Download .pb model files if not present."""
    dest.mkdir(parents=True, exist_ok=True)
    import urllib.request
    for filename, url in LEGACY_MODEL_URLS.items():
        fpath = dest / filename
        if not fpath.exists():
            print(f"  [download] {filename} …")
            urllib.request.urlretrieve(url, str(fpath))


def run_legacy_opencv(input_path: str, output_path: str,
                      model_name: str, scale: int, models_dir: Path) -> bool:
    """Run OpenCV dnn_superres.  model_name in {fsrcnn, espcn, edsr}."""
    pb_map = {
        ("fsrcnn", 2): "FSRCNN_x2.pb", ("fsrcnn", 3): "FSRCNN_x3.pb", ("fsrcnn", 4): "FSRCNN_x4.pb",
        ("espcn", 2):  "ESPCN_x2.pb",  ("espcn", 3):  "ESPCN_x3.pb",  ("espcn", 4):  "ESPCN_x4.pb",
        ("edsr", 2):   "EDSR_x2.pb",   ("edsr", 4):   "EDSR_x4.pb",
    }
    key = (model_name.lower(), scale)
    if key not in pb_map:
        print(f"  [!] No legacy model for {model_name} x{scale}")
        return False

    pb_file = models_dir / pb_map[key]
    if not pb_file.exists():
        print(f"  [!] Model file missing: {pb_file}")
        return False

    try:
        sr = dnn_superres.DnnSuperResImpl_create()
        sr.readModel(str(pb_file))
        sr.setModel(model_name.lower(), scale)

        img = cv2.imread(input_path)
        if img is None:
            return False

        result = sr.upsample(img)
        cv2.imwrite(output_path, result)
        return True
    except Exception as e:
        print(f"  [!] OpenCV {model_name} error: {e}")
        return False


# ─── 6. Benchmark Runner ─────────────────────────────────────────────────────

@dataclass
class BenchmarkResult:
    model: str
    scale: int
    input_size: str
    output_size: str
    time_sec: float
    cpu_avg: float
    cpu_peak: float
    ram_avg_mb: float
    ram_peak_mb: float
    gpu_avg: float
    gpu_peak: float
    vram_avg_mb: float
    vram_peak_mb: float
    success: bool
    engine: str  # "realesrgan" | "opencv"


# All benchmark configurations
BENCHMARK_CONFIGS = [
    # ── Real-ESRGAN models ──
    {"model": "realesrgan-x4plus",        "engine": "realesrgan", "scales": [4]},
    {"model": "realesr-animevideov3",     "engine": "realesrgan", "scales": [2, 3, 4]},
    {"model": "realesrgan-x4plus-anime",  "engine": "realesrgan", "scales": [4]},
    # ── Legacy OpenCV models ──
    {"model": "fsrcnn",  "engine": "opencv", "scales": [2, 3, 4]},
    {"model": "espcn",   "engine": "opencv", "scales": [2, 3, 4]},
    {"model": "edsr",    "engine": "opencv", "scales": [2, 4]},
]


def _run_single(config: dict, scale: int, img_path: Path,
                out_path: Path, models_dir: Path) -> BenchmarkResult:
    """Execute one (model × scale × image) benchmark."""
    name = config["model"]
    engine = config["engine"]
    w, h = Image.open(img_path).size
    input_size = f"{w}x{h}"

    monitor = ResourceMonitor()
    monitor.start()
    t0 = time.perf_counter()

    if engine == "realesrgan":
        ok = run_realesrgan(str(img_path), str(out_path), name, scale)
    else:
        ok = run_legacy_opencv(str(img_path), str(out_path), name, scale, models_dir)

    elapsed = time.perf_counter() - t0
    monitor.stop()
    stats = monitor.summary()

    if ok and out_path.exists():
        ow, oh = Image.open(out_path).size
        output_size = f"{ow}x{oh}"
    else:
        output_size = "FAILED"

    return BenchmarkResult(
        model=name,
        scale=scale,
        input_size=input_size,
        output_size=output_size,
        time_sec=round(elapsed, 2),
        success=ok,
        engine=engine,
        **stats,
    )


def run_benchmarks() -> list[BenchmarkResult]:
    """Run the full benchmark suite."""
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    models_dir = WORK_DIR / "legacy_models"

    # 1. Download legacy .pb models
    print("\n🔽  Downloading legacy OpenCV models …")
    _download_legacy_models(models_dir)

    # 2. Generate test images
    print("🖼  Generating test images …")
    test_images: dict[str, Path] = {}
    for w, h in IMAGE_SIZES:
        tag = f"{w}x{h}"
        path = WORK_DIR / f"test_{tag}.png"
        _make_test_image(w, h, path)
        test_images[tag] = path
        print(f"    ✓ {tag}")

    # 3. Print environment info
    _print_env()

    # 4. Run each config
    results: list[BenchmarkResult] = []
    total_runs = sum(
        len(c["scales"]) * len(IMAGE_SIZES) * REPEAT
        for c in BENCHMARK_CONFIGS
    )
    run_idx = 0

    for cfg in BENCHMARK_CONFIGS:
        name = cfg["model"]
        engine = cfg["engine"]
        for scale in cfg["scales"]:
            for tag, img_path in test_images.items():
                w, h = map(int, tag.split("x"))

                # Skip huge images on legacy CPU models to avoid >10 min waits
                if engine == "opencv" and cfg["model"] == "edsr" and w * h > 1024 * 1024:
                    print(f"  ⏭  Skipping {name} x{scale} @ {tag} (EDSR too slow at this size)")
                    run_idx += REPEAT
                    continue

                times = []
                last_result = None
                for r in range(REPEAT):
                    run_idx += 1
                    out_path = WORK_DIR / f"out_{name}_{scale}x_{tag}_r{r}.png"
                    pct = run_idx / total_runs * 100
                    print(f"\n[{run_idx}/{total_runs}] ({pct:.0f}%)  "
                          f"{name} x{scale}  |  {tag}  |  run {r+1}/{REPEAT}")

                    res = _run_single(cfg, scale, img_path, out_path, models_dir)
                    results.append(res)
                    times.append(res.time_sec)
                    last_result = res

                    # Cleanup output to save disk
                    if out_path.exists():
                        print("Output saved, you can see the output in the output tab …")

                if last_result and last_result.success:
                    avg_t = sum(times) / len(times)
                    print(f"  ✅  avg {avg_t:.2f}s  |  "
                          f"CPU {last_result.cpu_avg}%  RAM {last_result.ram_peak_mb:.0f}MB  "
                          f"GPU {last_result.gpu_peak}%  VRAM {last_result.vram_peak_mb:.0f}MB")

    return results


# ─── 7. Environment Info ─────────────────────────────────────────────────────
def _print_env():
    print("\n" + "=" * 70)
    print("  SYSTEM ENVIRONMENT")
    print("=" * 70)
    print(f"  Python:      {sys.version.split()[0]}")
    print(f"  PyTorch:     {torch.__version__}")
    print(f"  CUDA avail:  {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"  CUDA ver:    {torch.version.cuda}")
        print(f"  GPU name:    {torch.cuda.get_device_name(0)}")
        props = torch.cuda.get_device_properties(0)
        total_mem = getattr(props, "total_memory", None) or getattr(props, "total_mem", 0)
        print(f"  GPU memory:  {total_mem / 1024**3:.1f} GB")
        print(f"  SM count:    {props.multi_processor_count}")
    print(f"  CPU cores:   {psutil.cpu_count(logical=False)} physical, "
          f"{psutil.cpu_count(logical=True)} logical")
    mem = psutil.virtual_memory()
    print(f"  Total RAM:   {mem.total / 1024**3:.1f} GB")
    print(f"  OpenCV:      {cv2.__version__}")
    print("=" * 70 + "\n")


# ─── 8. Results Reporting ─────────────────────────────────────────────────────

def _aggregate(results: list[BenchmarkResult]) -> list[dict]:
    """Average repeated runs of the same (model, scale, input_size)."""
    from collections import defaultdict
    groups = defaultdict(list)
    for r in results:
        key = (r.model, r.scale, r.input_size, r.engine)
        groups[key].append(r)

    agg = []
    for (model, scale, input_size, engine), items in groups.items():
        ok_items = [i for i in items if i.success]
        if not ok_items:
            agg.append({
                "Model": model, "Scale": f"{scale}x", "Input": input_size,
                "Output": "FAILED", "Time(s)": "-", "CPU Avg%": "-",
                "CPU Peak%": "-", "RAM Peak(MB)": "-", "GPU Avg%": "-",
                "GPU Peak%": "-", "VRAM Peak(MB)": "-", "Engine": engine,
            })
            continue
        n = len(ok_items)
        agg.append({
            "Model": model,
            "Scale": f"{scale}x",
            "Input": input_size,
            "Output": ok_items[-1].output_size,
            "Time(s)": round(sum(i.time_sec for i in ok_items) / n, 2),
            "CPU Avg%": round(sum(i.cpu_avg for i in ok_items) / n, 1),
            "CPU Peak%": round(max(i.cpu_peak for i in ok_items), 1),
            "RAM Peak(MB)": round(max(i.ram_peak_mb for i in ok_items), 1),
            "GPU Avg%": round(sum(i.gpu_avg for i in ok_items) / n, 1),
            "GPU Peak%": round(max(i.gpu_peak for i in ok_items), 1),
            "VRAM Peak(MB)": round(max(i.vram_peak_mb for i in ok_items), 1),
            "Engine": engine,
        })
    return agg


def _write_csv(results: list[BenchmarkResult], path: Path):
    """Dump raw results to CSV."""
    fields = list(asdict(results[0]).keys())
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for r in results:
            writer.writerow(asdict(r))
    print(f"\n📄  Raw CSV saved → {path}")


def _write_summary(agg: list[dict], path: Path, env_gpu: str):
    """Write a human-readable summary + GPU rental recommendations."""
    lines = []
    lines.append("=" * 80)
    lines.append("  IMAGESTUDIO UPSCALING BENCHMARK — RESULTS SUMMARY")
    lines.append("=" * 80)
    lines.append(f"\n  Kaggle GPU used for test: {env_gpu}\n")
    lines.append(tabulate(agg, headers="keys", tablefmt="rounded_grid"))
    lines.append("")

    # ── GPU recommendation logic ──
    vram_peaks = [
        r["VRAM Peak(MB)"] for r in agg
        if isinstance(r.get("VRAM Peak(MB)"), (int, float)) and r["VRAM Peak(MB)"] > 0
    ]
    max_vram = max(vram_peaks) if vram_peaks else 0

    lines.append("\n" + "=" * 80)
    lines.append("  GPU RENTAL RECOMMENDATIONS")
    lines.append("=" * 80)
    lines.append(f"\n  Peak VRAM used across all models: {max_vram:.0f} MB\n")

    gpu_options = [
        # (name, vram_gb, approx $/hr, notes)
        ("NVIDIA T4",           16, 0.35, "Great for inference; Kaggle/Colab free tier GPU"),
        ("NVIDIA RTX 3060",     12, 0.20, "Budget option via Vast.ai / RunPod spot"),
        ("NVIDIA RTX 3090",     24, 0.35, "Best value high-VRAM via RunPod / Vast.ai"),
        ("NVIDIA RTX 4090",     24, 0.55, "Fastest consumer GPU; premium providers"),
        ("NVIDIA A10G",         24, 0.75, "AWS g5 / Render GPU instances"),
        ("NVIDIA L4",           24, 0.65, "Google Cloud; efficient Ampere successor to T4"),
        ("NVIDIA A100 40GB",    40, 1.50, "Overkill for upscaling; meant for training"),
    ]

    rec_lines = []
    for name, vram_gb, cost_hr, notes in gpu_options:
        vram_mb = vram_gb * 1024
        fits = "✅" if vram_mb >= max_vram * 1.3 else "⚠️ tight" if vram_mb >= max_vram else "❌"
        monthly = f"${cost_hr * 730:.0f}" if cost_hr else "—"
        rec_lines.append({
            "GPU": name,
            "VRAM": f"{vram_gb} GB",
            "Fits?": fits,
            "~$/hr": f"${cost_hr:.2f}",
            "~$/mo (24×7)": monthly,
            "Notes": notes,
        })

    lines.append(tabulate(rec_lines, headers="keys", tablefmt="rounded_grid"))

    lines.append("\n  💡  RECOMMENDATIONS:")
    if max_vram < 6 * 1024:
        lines.append("  • Your models fit comfortably in ≤6 GB VRAM.")
        lines.append("  • CHEAPEST: RTX 3060 (12 GB) on Vast.ai spot — ~$0.15–0.20/hr")
        lines.append("  • BEST VALUE: T4 via Kaggle/Colab (free) or Google Cloud ($0.35/hr)")
    elif max_vram < 12 * 1024:
        lines.append("  • Your models need 6–12 GB VRAM.")
        lines.append("  • CHEAPEST: T4 (16 GB) — $0.35/hr on multiple providers")
        lines.append("  • BEST VALUE: RTX 3090 (24 GB) on RunPod spot — $0.35/hr")
    else:
        lines.append("  • Your models need >12 GB VRAM.")
        lines.append("  • MINIMUM: RTX 3090 / A10G (24 GB)")
        lines.append("  • Consider enabling tile mode in Real-ESRGAN to reduce VRAM usage.")

    lines.append("\n  💡  COST-SAVING TIPS:")
    lines.append("  • Use spot/preemptible instances for 50-70% savings")
    lines.append("  • Scale to zero when idle (serverless GPU: Modal, Replicate, Banana)")
    lines.append("  • Process queue: batch images → spin up GPU → process → shut down")
    lines.append("  • For <100 images/day, serverless GPU ($0.0002/image) beats always-on")

    text = "\n".join(lines)
    with open(path, "w") as f:
        f.write(text)
    print(f"\n📋  Summary saved → {path}")
    print(text)


# ─── 9. Main ─────────────────────────────────────────────────────────────────
def main():
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║        IMAGESTUDIO  UPSCALING  BENCHMARK  v1.0             ║")
    print("║  Real-ESRGAN  •  FSRCNN  •  ESPCN  •  EDSR                ║")
    print("║  CPU / GPU / RAM profiling for GPU rental decisions        ║")
    print("╚══════════════════════════════════════════════════════════════╝")

    results = run_benchmarks()

    if not results:
        print("\n❌  No results collected. Something went wrong.")
        return

    # Aggregate & report
    agg = _aggregate(results)

    # CSV
    csv_path = RESULTS_DIR / "benchmark_results.csv"
    _write_csv(results, csv_path)

    # Summary
    env_gpu = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU only"
    summary_path = RESULTS_DIR / "benchmark_summary.txt"
    _write_summary(agg, summary_path, env_gpu)

    print("\n✅  Benchmark complete!")
    print(f"    CSV:     {csv_path}")
    print(f"    Summary: {summary_path}")


if __name__ == "__main__":
    main()
