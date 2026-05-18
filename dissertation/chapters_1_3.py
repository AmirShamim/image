"""
Chapters 1-3: Introduction, Objectives, Problem Analysis & Related Work.
"""
from config import (
    doc, add_heading_styled as add_h, add_para as add_p,
    add_bullet, add_numbered, add_code_block, add_table,
    add_figure_placeholder, add_figure_explanation, page_break,
    Pt, WD_ALIGN_PARAGRAPH
)


def build_chapter_1():
    """Chapter 1: Introduction (approx 3 pages)."""
    add_h("CHAPTER 1: INTRODUCTION", 1)

    add_h("1.1 Background and Motivation", 2)
    add_p(
        "Digital images have become the primary medium through which information is "
        "communicated on the modern internet. From product listings on e-commerce "
        "marketplaces to diagnostic scans shared between medical professionals, the "
        "fidelity of a digital photograph directly influences decision-making. Yet a "
        "significant volume of imagery circulating online today was originally captured "
        "under suboptimal conditions \u2014 low-cost mobile sensors, dim lighting, or network "
        "constrained environments where aggressive lossy compression was applied to reduce "
        "file size. When such images are subsequently displayed on contemporary high-density "
        "panels (4K UHD at 3840\u00d72160 pixels, or Apple Retina at 264 PPI), the deficit in "
        "spatial resolution becomes immediately perceptible as blocking artefacts, colour "
        "banding, and ringing along sharp edges."
    )
    add_p(
        "Historically, the software industry addressed this resolution gap through "
        "deterministic interpolation algorithms. Nearest-neighbour interpolation, the "
        "simplest variant, replicates the value of the closest existing pixel for each "
        "new sample, producing characteristically blocky outputs. Bilinear interpolation "
        "improves upon this by computing a weighted average of the four nearest pixels, "
        "yielding smoother transitions but still failing to reconstruct any texture that "
        "was not present in the original sample grid. Bicubic interpolation extends the "
        "averaging kernel to sixteen surrounding pixels and introduces cubic polynomial "
        "weighting, which reduces staircase aliasing but introduces perceptible haloing "
        "around high-contrast boundaries. Crucially, none of these classical methods can "
        "synthesise genuinely new image detail; they merely redistribute existing pixel "
        "values across a larger canvas."
    )
    add_p(
        "The advent of deep learning fundamentally altered this landscape. In 2014, Dong "
        "et al. demonstrated that a three-layer convolutional neural network (SRCNN) could "
        "learn a non-linear mapping from low-resolution patches to their high-resolution "
        "counterparts, outperforming bicubic interpolation by a statistically significant "
        "margin on standard benchmarks [1]. Subsequent architectures \u2014 FSRCNN [2], ESPCN [3], "
        "and EDSR [4] \u2014 progressively deepened these networks and introduced sub-pixel "
        "shuffling layers that drastically reduced computational overhead. However, the most "
        "consequential breakthrough arrived with Generative Adversarial Networks (GANs). "
        "SRGAN [5] introduced a perceptual loss function that penalised deviations in "
        "high-level feature space rather than pixel-wise mean squared error, producing "
        "outputs that were perceptually sharper even when they did not achieve the highest "
        "PSNR scores. Real-ESRGAN [6], published by Wang et al. in 2021, extended this "
        "paradigm by training the generator on a comprehensive synthetic degradation "
        "pipeline that modelled blur, noise, JPEG compression, and resize artefacts in "
        "a randomised sequence, enabling the network to generalise robustly to the diverse "
        "corruption patterns encountered in real-world photographs."
    )
    add_p(
        "Despite these academic advances, deploying such models for public consumption "
        "remained an unsolved engineering challenge. A single Real-ESRGAN inference pass "
        "on a 1024\u00d71024 pixel input at 4\u00d7 magnification allocates approximately 6 GB of "
        "GPU VRAM and completes in 3\u20137 seconds on an NVIDIA T4 accelerator. Hosting a "
        "dedicated GPU server continuously \u2014 even during idle periods \u2014 costs upwards of "
        "USD 300 per month on major cloud providers, rendering it economically infeasible "
        "for independent developers or student projects. This tension between computational "
        "demand and financial constraint served as the primary motivation for developing "
        "Upscale Pro."
    )

    add_h("1.2 The Upscale Pro Solution", 2)
    add_p(
        "Upscale Pro is a full-stack, production-grade SaaS platform that provides "
        "browser-based access to GPU-accelerated image super-resolution. Rather than "
        "requiring end-users to install Python interpreters, download multi-gigabyte "
        "PyTorch model weights, or possess local NVIDIA hardware, the platform abstracts "
        "the entire inference pipeline behind a single drag-and-drop web interface."
    )
    add_p(
        "The system architecture is decomposed into three strictly isolated tiers. The "
        "presentation layer is a React.js single-page application bundled with Vite and "
        "deployed on Vercel\u2019s edge network, ensuring sub-100ms initial page loads globally. "
        "The application layer is a Node.js Express server hosted on DigitalOcean, "
        "responsible for authentication, request validation, subscription enforcement, "
        "and orchestration. The inference layer consists of ephemeral Docker containers "
        "provisioned on Modal.com, each equipped with an NVIDIA T4 GPU, a pre-warmed "
        "PyTorch 2.x runtime, and the Real-ESRGAN model weights baked into a cached "
        "container image. When a user uploads an image, the Node.js server dispatches "
        "the payload to Modal via an HTTP Remote Procedure Call. The GPU container "
        "performs inference, uploads the resulting high-resolution image directly to "
        "Cloudinary\u2019s CDN, and returns only a lightweight URL string to the API server. "
        "This direct-to-cloud transfer pattern eliminates the need to route multi-megabyte "
        "binary buffers through the Node.js process, preventing heap memory exhaustion "
        "under concurrent load."
    )

    add_h("1.3 Scope of the Project", 2)
    add_p(
        "The scope of this project encompasses the end-to-end design, development, "
        "deployment, and testing of the Upscale Pro platform. Specifically, the project "
        "covers the following functional areas:"
    )
    add_bullet(
        "User registration with email verification, secure login via JWT, and password "
        "hashing with bcrypt."
    )
    add_bullet(
        "Two AI upscaling models: Real-ESRGAN Pro (optimised for photographs) and "
        "Real-ESRGAN Anime (optimised for illustrations and digital artwork)."
    )
    add_bullet(
        "Tiered subscription management with Free, Pro, and Business tiers enforced via "
        "server-side middleware."
    )
    add_bullet(
        "A batch processing module allowing Pro and Business users to queue multiple "
        "images for sequential GPU processing."
    )
    add_bullet(
        "Standard image manipulation utilities including resize, crop, and compression, "
        "executed client-side via the HTML5 Canvas API."
    )
    add_bullet(
        "An analytics dashboard displaying historical usage metrics, processing latency "
        "distributions, and quota consumption."
    )
    add_p(
        "The project does not include the training or fine-tuning of the Real-ESRGAN "
        "model weights; pre-trained checkpoints published by Wang et al. [6] are utilised "
        "directly. Additionally, the Stripe payment gateway integration is prepared but "
        "operates in test mode within this academic submission."
    )
    page_break()


def build_chapter_2():
    """Chapter 2: Objectives (approx 1.5 pages)."""
    add_h("CHAPTER 2: OBJECTIVES", 1)
    add_p(
        "The primary objective of this dissertation is to architect, implement, and "
        "deploy a commercially viable web platform that transforms advanced AI image "
        "upscaling from a command-line research tool into an accessible, browser-based "
        "service. The following specific engineering and business objectives were "
        "established at the project\u2019s inception:"
    )

    add_h("2.1 Decoupled Microservice Architecture", 2)
    add_p(
        "To design a three-tier architecture that strictly separates the user interface, "
        "the API gateway, and the machine learning inference engine into independently "
        "deployable units. The React.js frontend must be deployable on a static CDN "
        "(Vercel), the Node.js backend must run on a standard Linux virtual private "
        "server (DigitalOcean), and the PyTorch inference must execute on isolated, "
        "ephemeral GPU containers (Modal.com). This separation ensures that a CPU-bound "
        "authentication query never competes for resources with a GPU-bound tensor "
        "computation."
    )

    add_h("2.2 Sub-Ten-Second Processing Latency", 2)
    add_p(
        "To achieve an average end-to-end image processing time of less than ten seconds "
        "for standard payloads (input dimensions not exceeding 2048\u00d72048 pixels at 2\u00d7 "
        "scale). This benchmark was established after profiling the legacy CPU-based "
        "pipeline, which required over 120 seconds per image using EDSR on an Intel "
        "Xeon processor. The target latency is achieved by provisioning NVIDIA T4 GPUs "
        "with 16 GB VRAM through Modal\u2019s cold-start-optimised container scheduler."
    )

    add_h("2.3 Direct-to-Cloud Transfer Pipeline", 2)
    add_p(
        "To implement a file transfer mechanism whereby the GPU container uploads the "
        "finalised high-resolution image directly to Cloudinary\u2019s object storage, "
        "returning only a string URL to the Node.js server. This objective arose from "
        "a critical production incident in which transmitting 15\u201320 MB binary buffers "
        "through the Node.js process triggered V8 heap allocation failures and caused "
        "the server to crash under concurrent load."
    )

    add_h("2.4 Multi-Tenant Subscription Enforcement", 2)
    add_p(
        "To implement a tiered access control system backed by Neon Serverless PostgreSQL "
        "that distinguishes between Guest, Free, Pro, and Business users. Each tier defines "
        "specific quotas for daily upscale operations, maximum input dimensions, and access "
        "to premium models. Rate limiting middleware at the API gateway prevents abuse and "
        "protects the GPU budget from billing spikes."
    )

    add_h("2.5 Responsive and Accessible User Experience", 2)
    add_p(
        "To deliver a polished, mobile-responsive user interface that requires no technical "
        "knowledge to operate. The interface must support drag-and-drop image upload, "
        "real-time processing status feedback, an interactive before-and-after comparison "
        "slider, and one-click download of the enhanced output."
    )
    page_break()


def build_chapter_3():
    """Chapter 3: Problem Analysis and Related Work (approx 3 pages)."""
    add_h("CHAPTER 3: PROBLEM ANALYSIS AND RELATED WORK", 1)
    add_p(
        "This chapter examines the technical and infrastructural challenges that motivated "
        "the development of Upscale Pro. It also presents a comparative analysis of existing "
        "image enhancement platforms to contextualise the contributions of this project."
    )

    add_h("3.1 The Quality Bottleneck", 2)
    add_p(
        "Classical interpolation methods operate entirely in the spatial domain. They "
        "compute new pixel values as weighted combinations of existing samples without "
        "any learned prior about natural image statistics. As a result, they cannot "
        "distinguish between a smooth gradient (which should remain smooth) and a textured "
        "region (which should exhibit high-frequency detail). This limitation is starkly "
        "visible when upscaling JPEG-compressed photographs: bicubic interpolation not "
        "only fails to remove blocking artefacts but actively amplifies them by smoothing "
        "across block boundaries."
    )
    add_p(
        "Neural super-resolution addresses this by learning a mapping function from a "
        "training corpus of millions of paired low-resolution and high-resolution image "
        "patches. The Real-ESRGAN generator, based on the RRDB (Residual-in-Residual "
        "Dense Block) architecture, contains 23 cascaded residual blocks totalling "
        "approximately 16.7 million trainable parameters. During inference, this network "
        "reconstructs plausible high-frequency textures \u2014 brick mortar lines, individual "
        "hair strands, fabric weave patterns \u2014 that are entirely absent from the input, "
        "guided by the statistical priors encoded in its learned weights."
    )
    add_figure_placeholder(
        "Side-by-side comparison of bicubic interpolation versus Real-ESRGAN 4\u00d7 upscaling "
        "on a JPEG-compressed photograph of architectural masonry",
        "5.1"
    )
    add_figure_explanation(
        "Fig. 5.1 illustrates the qualitative difference between classical and neural "
        "upscaling. The left panel shows the output of bicubic interpolation applied to "
        "a 256\u00d7256 pixel JPEG image at 4\u00d7 magnification: mortar lines between bricks are "
        "smoothed into an indistinct grey wash, and JPEG blocking artefacts are visibly "
        "amplified. The right panel shows the Real-ESRGAN Pro output for the identical "
        "input: the network has hallucinated realistic mortar depth, individual surface "
        "irregularities on each brick, and sharp shadow boundaries, producing a 1024\u00d71024 "
        "output that is perceptually indistinguishable from a natively high-resolution capture."
    )

    add_h("3.2 The Infrastructure Bottleneck", 2)
    add_p(
        "Even after the quality problem is solved by neural networks, a severe deployment "
        "challenge remains. The Real-ESRGAN model requires an NVIDIA GPU with at least "
        "4 GB of VRAM for 2\u00d7 inference and 8\u201316 GB for 4\u00d7 inference on larger inputs. "
        "Loading the model weights into GPU memory takes approximately 2\u20133 seconds, and "
        "each forward pass consumes 3\u20137 seconds depending on input resolution."
    )
    add_p(
        "A na\u00efve deployment approach \u2014 hosting the PyTorch model directly inside the "
        "Node.js web server process, or spawning a Python child process on the same machine "
        "\u2014 creates multiple failure modes:"
    )
    add_bullet(
        "Memory Exhaustion: The Node.js V8 engine has a default heap limit of approximately "
        "1.7 GB. A single 4\u00d7 upscaled image at 4096\u00d74096 pixels in RGBA format occupies "
        "64 MB in raw buffer form. Processing five concurrent requests would require 320 MB "
        "of buffer memory plus the base server footprint, rapidly approaching the heap ceiling."
    )
    add_bullet(
        "CPU Starvation: If PyTorch executes on the same CPU core as the Express.js event "
        "loop, the matrix multiplication operations block all incoming HTTP connections. "
        "A five-second inference pass effectively creates a five-second denial of service "
        "for every other user."
    )
    add_bullet(
        "Process Crash Cascade: An Out-of-Memory (OOM) kill signal from the operating system "
        "terminates the entire Node.js process, disconnecting all active WebSocket connections "
        "and losing in-flight request state."
    )
    add_p(
        "Upscale Pro resolves these failure modes by delegating all GPU computation to "
        "Modal.com\u2019s serverless container platform. Each inference request spawns an "
        "independent, ephemeral container with its own dedicated GPU, VRAM allocation, "
        "and Python runtime. The Node.js server never handles binary image data beyond "
        "the initial upload validation, and failures in the GPU layer are isolated from "
        "the web server\u2019s uptime."
    )
    add_figure_placeholder(
        "Real-ESRGAN second-order degradation pipeline showing blur, noise, JPEG "
        "compression, and resize operations applied in randomised order",
        "5.2"
    )
    add_figure_explanation(
        "Fig. 5.2 depicts the synthetic degradation model employed during Real-ESRGAN "
        "training, as described by Wang et al. [6]. High-resolution ground-truth images "
        "are subjected to two sequential degradation passes, each comprising a randomly "
        "selected blur kernel (Gaussian or sinc), additive noise (Gaussian or Poisson), "
        "resize operation (bilinear, bicubic, or area), and JPEG compression at a random "
        "quality factor. This pipeline generates training pairs that closely approximate "
        "the diverse corruption patterns found in real-world internet imagery, enabling "
        "the trained model to generalise beyond the clean degradation assumptions of "
        "earlier architectures like SRCNN."
    )

    add_h("3.3 Comparative Analysis of Existing Systems", 2)
    add_p(
        "Several commercial and open-source platforms offer image upscaling services. "
        "The following table presents a comparative evaluation across key functional "
        "and architectural dimensions:"
    )
    add_table(
        ["Platform", "AI Model", "GPU Infra", "Free Tier", "Batch", "API Access"],
        [
            ["Let\u2019s Enhance", "ESRGAN variant", "Dedicated", "5 images", "Yes", "Paid"],
            ["Topaz Gigapixel", "Proprietary CNN", "Local GPU", "Trial only", "Yes", "No"],
            ["Waifu2x", "SRCNN", "Shared CPU", "Unlimited", "No", "No"],
            ["Bigjpg", "CNN (unspecified)", "Shared", "20/month", "No", "Paid"],
            ["Upscale Pro", "Real-ESRGAN", "Serverless GPU", "3/day", "Yes", "Planned"],
        ]
    )
    add_p(
        "As Table 5.1 demonstrates, existing platforms either require expensive local "
        "GPU hardware (Topaz), impose severe free-tier limitations (Let\u2019s Enhance), or "
        "rely on older, lower-quality models (Waifu2x). Upscale Pro differentiates itself "
        "through its serverless GPU architecture, which eliminates fixed infrastructure "
        "costs while maintaining sub-ten-second processing times, and through its dual-model "
        "offering that serves both photographic and illustration use cases."
    )
    page_break()


def build_chapters_1_to_3():
    """Entry point for Chapters 1-3."""
    build_chapter_1()
    build_chapter_2()
    build_chapter_3()
