"""
Chapters 4-6: Feasibility Study, Technology/Platform Overview, SRS.
"""
from config import (
    doc, add_heading_styled as add_h, add_para as add_p,
    add_bullet, add_numbered, add_code_block, add_table,
    add_figure_placeholder, add_figure_explanation, page_break,
    Pt, WD_ALIGN_PARAGRAPH
)


def build_chapter_4():
    """Chapter 4: Feasibility Study (approx 2 pages)."""
    add_h("CHAPTER 4: FEASIBILITY STUDY", 1)
    add_p(
        "A feasibility study evaluates whether a proposed system is practical to build, "
        "deploy, and maintain within the available resource constraints. For Upscale Pro, "
        "feasibility was assessed across three dimensions: economic viability, technical "
        "capability, and operational acceptability."
    )

    add_h("4.1 Economic Feasibility", 2)
    add_p(
        "The dominant cost driver in any AI-powered image processing system is GPU compute. "
        "Renting a dedicated NVIDIA A10G instance on AWS (g5.xlarge) costs approximately "
        "USD 1.006 per hour, translating to roughly USD 725 per month for continuous operation. "
        "For a student project with no external funding, this expenditure is prohibitive."
    )
    add_p(
        "Upscale Pro circumvents this constraint through serverless GPU provisioning via "
        "Modal.com. Under this model, GPU containers are instantiated only when an inference "
        "request arrives and are terminated immediately upon completion. Modal charges "
        "USD 0.000164 per GPU-second for T4 instances. Given an average inference time of "
        "5 seconds per image, the per-image cost is approximately USD 0.00082 \u2014 effectively "
        "negligible for the traffic volumes anticipated during an academic demonstration."
    )
    add_p(
        "The remaining infrastructure was provisioned using free-tier allowances and student "
        "credits. The Node.js API server runs on a DigitalOcean Droplet funded by USD 200 "
        "in GitHub Education credits. The Neon Serverless PostgreSQL database operates within "
        "its free tier (0.5 GB storage, 100 compute-hours per month). Cloudinary provides "
        "25 GB of media storage and 25 GB of monthly bandwidth at no cost. The React frontend "
        "is deployed on Vercel\u2019s free Hobby plan. Consequently, the total capital expenditure "
        "required to launch this SaaS platform was effectively zero dollars, confirming "
        "strong economic feasibility."
    )

    add_h("4.2 Technical Feasibility", 2)
    add_p(
        "The primary technical risk identified during the planning phase was Node.js heap "
        "memory exhaustion caused by large binary image buffers. A 4\u00d7 upscaled 2048\u00d72048 "
        "image in PNG format can exceed 15 MB. Buffering even three such payloads "
        "simultaneously in the Node.js process would consume 45 MB of heap memory, approaching "
        "dangerous thresholds when combined with the base memory footprint of Express middleware, "
        "database connection pools, and JWT verification libraries."
    )
    add_p(
        "This risk was mitigated by implementing a direct-to-cloud upload pipeline. The Modal "
        "GPU container, after completing inference, uploads the output image directly to "
        "Cloudinary using Cloudinary\u2019s Python SDK and returns only a lightweight JSON object "
        "containing the asset URL. The Node.js server never allocates memory for the output "
        "image binary, reducing its peak memory consumption by over 90 percent."
    )
    add_p(
        "The chosen technology stack \u2014 React 18, Node.js 20 LTS, Express 4, PostgreSQL 16, "
        "Python 3.11, PyTorch 2.1 \u2014 represents mature, battle-tested components with extensive "
        "community support and well-documented APIs. No experimental or pre-release dependencies "
        "are used, confirming the system\u2019s technical feasibility."
    )

    add_h("4.3 Operational Feasibility", 2)
    add_p(
        "Operational feasibility measures how effectively the system addresses its target "
        "users\u2019 needs and how easily those users can adopt it. The target user persona for "
        "Upscale Pro is a non-technical individual \u2014 a social media content creator, an "
        "e-commerce seller, or a student restoring old family photographs \u2014 who possesses "
        "no knowledge of Python, PyTorch, or GPU computing."
    )
    add_p(
        "Prior to Upscale Pro, utilising Real-ESRGAN required the following manual steps: "
        "(i) install a Python 3.x interpreter, (ii) configure a CUDA-compatible GPU driver, "
        "(iii) install the PyTorch library (approximately 2.1 GB download), (iv) clone the "
        "Real-ESRGAN GitHub repository, (v) download pre-trained model weights (approximately "
        "67 MB per model), and (vi) execute a command-line script with correctly formatted "
        "arguments. This multi-step process demands significant technical literacy and is "
        "entirely inaccessible to the platform\u2019s target audience."
    )
    add_p(
        "Upscale Pro reduces this workflow to three actions: (1) open a web browser, "
        "(2) drag and drop an image onto the upload zone, and (3) click the \u201cUpscale\u201d "
        "button. All compilation, model loading, tensor computation, and cloud storage "
        "operations are handled transparently in the backend. The resulting user experience "
        "is operationally comparable to uploading a photograph to Instagram, confirming "
        "strong operational feasibility."
    )
    page_break()


def build_chapter_5():
    """Chapter 5: Technology and Platform Overview (approx 4 pages)."""
    add_h("CHAPTER 5: TECHNOLOGY AND PLATFORM OVERVIEW", 1)
    add_p(
        "This chapter provides a comprehensive overview of the software and hardware "
        "environment required to develop, deploy, and operate Upscale Pro. Each "
        "technology selection is justified with reference to the specific architectural "
        "constraint it addresses."
    )

    add_h("5.1 Software Requirements", 2)
    add_table(
        ["Category", "Technology", "Version"],
        [
            ["Operating System", "Ubuntu 22.04 LTS (Server) / Windows 11 (Dev)", "22.04 / 23H2"],
            ["Runtime (Backend)", "Node.js", "20.11 LTS"],
            ["Runtime (GPU)", "Python", "3.11"],
            ["Frontend Framework", "React.js (via Vite)", "18.2"],
            ["Backend Framework", "Express.js", "4.18"],
            ["AI Framework", "PyTorch", "2.1"],
            ["Database", "PostgreSQL (Neon Serverless)", "16"],
            ["Cloud Storage", "Cloudinary", "v2 API"],
            ["GPU Platform", "Modal.com", "0.62"],
            ["IDE", "Visual Studio Code", "1.88"],
            ["Browser (Testing)", "Google Chrome", "124"],
            ["Version Control", "Git / GitHub", "2.44"],
        ]
    )

    add_h("5.2 Hardware Requirements", 2)
    add_table(
        ["Component", "Development Machine", "Production Server"],
        [
            ["Processor", "Intel Core i5 10th Gen / equivalent", "2 vCPU (DigitalOcean)"],
            ["RAM", "8 GB minimum", "2 GB"],
            ["Storage", "50 GB SSD", "50 GB SSD"],
            ["GPU", "Not required (inference is remote)", "NVIDIA T4 16 GB (Modal)"],
            ["Network", "Broadband internet connection", "1 Gbps (DigitalOcean DC)"],
            ["Display", '15" colour monitor', "N/A (headless)"],
        ]
    )

    add_h("5.3 Software Configuration", 2)
    add_p("The system\u2019s technology stack is organised into four distinct layers:", bold=True)
    add_p("Frontend Layer:", bold=True)
    add_bullet("React.js 18 with JSX component architecture")
    add_bullet("Vite 5 as the build tool and development server")
    add_bullet("Vanilla CSS with CSS custom properties for theming")
    add_bullet("React Router v6 for client-side routing")
    add_p("Backend Layer:", bold=True)
    add_bullet("Node.js 20 LTS with Express.js 4 middleware framework")
    add_bullet("Multer for multipart/form-data file upload handling")
    add_bullet("bcrypt for password hashing; jsonwebtoken for JWT generation")
    add_bullet("Sharp for standard image resize and compression operations")
    add_p("AI Inference Layer:", bold=True)
    add_bullet("Python 3.11 with PyTorch 2.1 and CUDA 12.1 toolkit")
    add_bullet("Real-ESRGAN inference module with RRDBNet generator architecture")
    add_bullet("Modal.com SDK for serverless container orchestration")
    add_p("Data and Storage Layer:", bold=True)
    add_bullet("Neon Serverless PostgreSQL 16 with connection pooling")
    add_bullet("Cloudinary v2 API for CDN-backed image asset storage")

    add_h("5.4 Technology Features and Justification", 2)

    add_h("5.4.1 React.js", 3)
    add_p(
        "React.js is a declarative, component-based JavaScript library maintained by Meta "
        "for constructing user interfaces. It was selected for Upscale Pro for the following "
        "reasons:"
    )
    add_p("Key Features:", bold=True)
    add_bullet(
        "Virtual DOM Reconciliation: React maintains an in-memory representation of the "
        "UI tree and computes the minimal set of DOM mutations required when state changes. "
        "This is critical for the before-and-after comparison slider, where only the overlay "
        "clip-path property must update on each mouse-move event, not the entire page."
    )
    add_bullet(
        "Component Reusability: Each UI element \u2014 the upload dropzone, the comparison slider, "
        "the pricing card, the usage meter \u2014 is encapsulated as a self-contained component "
        "with its own state, props interface, and CSS module."
    )
    add_bullet(
        "Hooks API: The useEffect and useState hooks enable side-effect management (API calls, "
        "event listeners) without class-based boilerplate, resulting in significantly smaller "
        "component files."
    )
    add_p("Advantages:", bold=True)
    add_bullet("Extensive ecosystem of open-source component libraries and tooling.")
    add_bullet("Strong developer community with comprehensive documentation and tutorials.")
    add_bullet("Seamless integration with Vite for instant hot module replacement during development.")

    add_h("5.4.2 Node.js and Express.js", 3)
    add_p(
        "Node.js is a JavaScript runtime built on Chrome\u2019s V8 engine. Express.js is a "
        "minimal web application framework for Node.js. Together, they power the Upscale Pro "
        "API gateway."
    )
    add_p("Key Features:", bold=True)
    add_bullet(
        "Asynchronous Event Loop: Node.js operates on a single-threaded event loop with "
        "non-blocking I/O. When the server dispatches an upscale request to Modal, it does "
        "not block \u2014 it immediately resumes processing other incoming HTTP requests. This "
        "architecture is ideal for I/O-bound workloads where the server spends most of its "
        "time waiting for external services to respond."
    )
    add_bullet(
        "Middleware Pipeline: Express.js allows composable middleware functions that execute "
        "sequentially on each request. Upscale Pro uses this for JWT verification, rate "
        "limiting, file validation, and request logging."
    )
    add_p("Advantages:", bold=True)
    add_bullet("Unified JavaScript across frontend and backend reduces context switching.")
    add_bullet("npm ecosystem provides pre-built packages for every common server-side task.")
    add_bullet("Low memory footprint suitable for cost-effective VPS hosting.")

    add_h("5.4.3 PyTorch and Real-ESRGAN", 3)
    add_p(
        "PyTorch is an open-source machine learning framework developed by Meta AI Research. "
        "It provides GPU-accelerated tensor computation and automatic differentiation. "
        "Real-ESRGAN is a practical image restoration algorithm that uses the RRDB "
        "(Residual-in-Residual Dense Block) generator architecture."
    )
    add_p("Key Features:", bold=True)
    add_bullet(
        "Dynamic Computational Graph: PyTorch constructs the computation graph on-the-fly "
        "during each forward pass, simplifying debugging and enabling variable input sizes."
    )
    add_bullet(
        "CUDA Integration: Native CUDA kernel dispatch ensures that tensor operations "
        "execute on the GPU without manual memory management."
    )
    add_bullet(
        "Pre-trained Weights: The Real-ESRGAN project provides downloadable .pth checkpoint "
        "files for both the general-purpose (x4plus) and anime-specific (x4plus_anime_6B) models."
    )

    add_h("5.4.4 Neon Serverless PostgreSQL", 3)
    add_p(
        "Neon is a fully managed, serverless PostgreSQL service that separates compute and "
        "storage, allowing the database to scale to zero during idle periods and resume "
        "within milliseconds on the next query."
    )
    add_p("Key Features:", bold=True)
    add_bullet("Automatic connection pooling at the edge via PgBouncer integration.")
    add_bullet("Branching support for creating isolated database copies for testing.")
    add_bullet("Autoscaling compute that eliminates the need for manual capacity planning.")

    add_h("5.4.5 Cloudinary CDN", 3)
    add_p(
        "Cloudinary is a cloud-based media management platform that provides programmable "
        "image and video APIs backed by a global content delivery network."
    )
    add_p("Key Features:", bold=True)
    add_bullet("Direct upload API callable from any server-side SDK (Node.js or Python).")
    add_bullet("Automatic format negotiation (WebP, AVIF) based on the requesting browser.")
    add_bullet("On-the-fly image transformations via URL parameters.")

    add_h("5.4.6 Modal.com Serverless GPU Platform", 3)
    add_p(
        "Modal is a serverless computing platform specialised for GPU workloads. It enables "
        "developers to define Python functions that execute in remote containers with "
        "pre-configured NVIDIA GPU drivers, CUDA toolkits, and Python dependencies."
    )
    add_p("Key Features:", bold=True)
    add_bullet(
        "Cold-Start Optimisation: Container images with PyTorch and model weights are "
        "pre-cached on Modal\u2019s infrastructure, reducing cold-start latency to 2\u20133 seconds."
    )
    add_bullet(
        "Per-Second Billing: Compute charges accrue only during active function execution, "
        "eliminating idle costs entirely."
    )
    add_bullet(
        "HTTP Endpoint Exposure: Modal functions can be exposed as web endpoints, enabling "
        "the Node.js server to invoke them via standard HTTP POST requests."
    )
    page_break()


def build_chapter_6():
    """Chapter 6: Software Requirement Specification (approx 2 pages)."""
    add_h("CHAPTER 6: SOFTWARE REQUIREMENT SPECIFICATION", 1)

    add_h("6.1 Introduction", 2)
    add_p("6.1.1 Purpose", bold=True)
    add_p(
        "The purpose of this Software Requirement Specification (SRS) document is to "
        "provide a comprehensive description of the Upscale Pro system\u2019s functional "
        "capabilities, performance constraints, and interface requirements. This document "
        "serves as the contractual baseline between the development team and the project "
        "supervisor."
    )
    add_p("6.1.2 Scope", bold=True)
    add_p(
        "The software system under specification is an asynchronous, cloud-based image "
        "upscaling platform that accepts standard web image formats (JPEG, PNG, WebP) "
        "and produces enhanced high-resolution outputs using GPU-accelerated neural "
        "network inference."
    )

    add_h("6.2 Functional Requirements", 2)
    add_table(
        ["Req. ID", "Requirement", "Description"],
        [
            ["REQ-F01", "User Registration",
             "The system shall allow new users to register with email, username, and password. "
             "Passwords shall be hashed using bcrypt with a salt round of 10."],
            ["REQ-F02", "Email Verification",
             "Upon registration, the system shall send a 6-digit OTP to the user\u2019s email address. "
             "The account shall remain inactive until the OTP is verified."],
            ["REQ-F03", "Secure Authentication",
             "The system shall authenticate users via JWT tokens with a configurable expiry (default 7 days). "
             "Tokens are transmitted via HTTP-only cookies."],
            ["REQ-F04", "Image Upload Validation",
             "The API gateway shall validate MIME types (image/jpeg, image/png, image/webp), "
             "reject payloads exceeding 10 MB, and strip EXIF metadata."],
            ["REQ-F05", "GPU Inference Dispatch",
             "Upon receiving a valid upscale request, the server shall invoke the Modal endpoint "
             "via HTTP POST, passing the image as a base64-encoded string."],
            ["REQ-F06", "Direct Cloud Upload",
             "The Modal GPU container shall upload the processed image to Cloudinary and return "
             "only the asset URL to the Node.js server."],
            ["REQ-F07", "Comparison Slider",
             "The frontend shall render an interactive, draggable slider overlay that reveals "
             "the original and upscaled images side by side."],
            ["REQ-F08", "Batch Processing",
             "Pro and Business tier users shall be able to queue up to 10 images for sequential "
             "GPU processing in a single session."],
        ]
    )

    add_h("6.3 Non-Functional Requirements", 2)
    add_table(
        ["Req. ID", "Category", "Requirement"],
        [
            ["REQ-NF01", "Performance",
             "End-to-end processing latency shall not exceed 10 seconds for inputs up to 2048x2048 px."],
            ["REQ-NF02", "Scalability",
             "The system shall support at least 50 concurrent upscale requests via Modal\u2019s auto-scaling."],
            ["REQ-NF03", "Security",
             "All API endpoints shall enforce JWT authentication. Rate limiting shall restrict "
             "unauthenticated clients to 200 requests per 15-minute window."],
            ["REQ-NF04", "Availability",
             "The Node.js server shall maintain 99.5% uptime. GPU container failures shall not "
             "cascade to the web server."],
            ["REQ-NF05", "VRAM Constraints",
             "The frontend shall dynamically restrict input dimensions to 2048px (2\u00d7) or 1024px (4\u00d7) "
             "to prevent GPU OOM errors."],
            ["REQ-NF06", "Usability",
             "The interface shall be fully responsive across desktop (1920px), tablet (768px), "
             "and mobile (375px) viewports."],
        ]
    )
    page_break()


def build_chapters_4_to_6():
    """Entry point for Chapters 4-6."""
    build_chapter_4()
    build_chapter_5()
    build_chapter_6()
