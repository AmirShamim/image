# 9. Limitation

While the implemented SaaS achieves significant performance milestones via architectural decoupling, several static constraints remain native to the deployment ecosystem:
1. **Hard VRAM Saturation Limits:** To prevent out-of-memory errors on the serverless NVIDIA configurations (typically 16GB VRAM on a T4 allocation), the system strictly caps input dimensions. Input images cannot exceed 2048px in either dimension for a 2x upscale, or 1024px for a 4x upscale, effectively rejecting massive print-ready canvases unless they are cropped manually prior to upload.
2. **Cold Start Latency:** Serverless architecture saves costs by spinning down ephemeral GPU containers when idle. If a user triggers a request during a "cold" phase, the initialization of the PyTorch environment and model weight ingestion can append a variable latency overhead (up to 5-8 seconds) prior to the baseline processing time.
3. **Format Support Specificity:** The system exclusively processes rasterized 2D matrices (JPEG/PNG). Vector upsampling and `.gif`/`.mp4` temporal frame processing are unsupported.
