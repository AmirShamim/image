"""
Chapter 7: System Analysis and Design (DFDs + ER Diagram).
Chapter 8: Implementation and Results (Project Init + Full Walkthrough with Screenshots).
"""
from config import (
    doc, add_heading_styled as add_h, add_para as add_p,
    add_bullet, add_code_block,
    add_figure_placeholder, add_figure_explanation, page_break,
    Pt, WD_ALIGN_PARAGRAPH
)


def build_chapter_7():
    """Chapter 7: System Analysis and Design (approx 3 pages)."""
    add_h("CHAPTER 7: SYSTEM ANALYSIS AND DESIGN", 1)
    add_p(
        "System analysis translates the functional requirements defined in the SRS into "
        "visual models that depict data flow, process decomposition, and entity relationships. "
        "This chapter presents the Data Flow Diagrams (DFDs) at two levels of abstraction "
        "and the Entity Relationship Diagram for the Upscale Pro database schema."
    )

    # ── 7.1 Context Level DFD ──
    add_h("7.1 Context Level Data Flow Diagram (Level 0)", 2)
    add_p(
        "The context diagram represents the entire Upscale Pro system as a single process, "
        "illustrating the external entities that interact with it and the data flows between them."
    )
    add_p(
        "External entities identified in the Upscale Pro ecosystem are: (i) the End User "
        "who uploads images and receives processed outputs, (ii) the Cloudinary CDN which "
        "receives and stores high-resolution images, (iii) the Modal GPU Cluster which "
        "receives inference requests and returns processing results, and (iv) the Neon "
        "PostgreSQL Database which persists user accounts, subscription tiers, and "
        "processing logs."
    )
    add_p(
        "The data flows entering the system include: user registration credentials, login "
        "tokens, image upload payloads, and subscription selection events. Outgoing data "
        "flows include: authentication responses, upscaled image URLs, processing status "
        "updates, and usage analytics summaries."
    )
    add_figure_placeholder(
        "Context Level DFD (Level 0) showing the Upscale Pro system as a central process "
        "with four external entities: End User, Cloudinary CDN, Modal GPU Cluster, and "
        "Neon PostgreSQL Database",
        "7.1"
    )
    add_figure_explanation(
        "Fig. 7.1 presents the Level 0 context diagram for Upscale Pro. The central "
        "bubble labelled \u2018Upscale Pro System\u2019 represents the entire application stack. "
        "The End User entity transmits image files and authentication credentials into "
        "the system and receives upscaled image URLs and session tokens in return. The "
        "Modal GPU Cluster entity receives base64-encoded image payloads and returns "
        "Cloudinary asset URLs after inference. The Cloudinary CDN entity receives "
        "binary image uploads directly from the GPU container and serves them to the "
        "frontend via its global edge network. The Neon PostgreSQL entity handles "
        "bidirectional read/write operations for user profiles, subscription records, "
        "and analytics logs."
    )

    # ── 7.2 Level 1 DFD ──
    add_h("7.2 Level 1 Data Flow Diagram", 2)
    add_p(
        "The Level 1 DFD decomposes the central process from the context diagram into "
        "its constituent subsystems, revealing the internal processing stages and data stores."
    )
    add_p(
        "The decomposed processes are:"
    )
    add_bullet(
        "P1 \u2013 Authentication Module: Handles user registration, email OTP verification, "
        "login, JWT generation, and password reset flows. Reads from and writes to the "
        "Users data store."
    )
    add_bullet(
        "P2 \u2013 Upload Validation Module: Receives the uploaded image file, validates MIME "
        "type, enforces file size limits, checks the user\u2019s remaining daily quota against "
        "the Subscriptions data store, and encodes the image to base64."
    )
    add_bullet(
        "P3 \u2013 GPU Dispatch Module: Forwards the validated base64 payload to the Modal "
        "GPU endpoint via HTTP POST. Monitors the response and extracts the Cloudinary URL "
        "upon success."
    )
    add_bullet(
        "P4 \u2013 Result Delivery Module: Stores the processing log (model used, latency, "
        "input/output dimensions) in the Processing Logs data store and returns the "
        "Cloudinary URL to the React frontend."
    )
    add_bullet(
        "P5 \u2013 Analytics Module: Aggregates historical processing logs and presents usage "
        "trends, model preference distributions, and latency percentiles on the dashboard."
    )
    add_figure_placeholder(
        "Level 1 DFD showing five decomposed processes (Authentication, Upload Validation, "
        "GPU Dispatch, Result Delivery, Analytics) with data stores for Users, Subscriptions, "
        "and Processing Logs",
        "7.2"
    )
    add_figure_explanation(
        "Fig. 7.2 illustrates the Level 1 decomposition of the Upscale Pro system. Each "
        "numbered process bubble corresponds to a distinct Express.js route module in the "
        "codebase. Data Store D1 (Users) is accessed by the Authentication Module for "
        "credential verification. Data Store D2 (Subscriptions) is queried by the Upload "
        "Validation Module to enforce tier-specific quotas. Data Store D3 (Processing Logs) "
        "is written to by the Result Delivery Module and read from by the Analytics Module. "
        "The arrows between processes represent the sequential flow of an upscale request: "
        "authentication \u2192 validation \u2192 dispatch \u2192 delivery."
    )

    # ── 7.3 ER Diagram ──
    add_h("7.3 Entity Relationship Diagram", 2)
    add_p(
        "The Entity Relationship Diagram models the persistent data structures stored in "
        "the Neon PostgreSQL database. The schema was designed to support multi-tenant "
        "subscription management and detailed processing analytics."
    )
    add_p("The primary entities and their attributes are:", bold=True)
    add_bullet(
        "Users: user_id (PK), username, email (UNIQUE), password_hash, is_verified, "
        "profile_picture_url, created_at, updated_at."
    )
    add_bullet(
        "Subscriptions: subscription_id (PK), user_id (FK \u2192 Users), tier (ENUM: free, "
        "pro, business), daily_quota, max_input_px, started_at, expires_at."
    )
    add_bullet(
        "Processing_Logs: log_id (PK), user_id (FK \u2192 Users), model_type, scale_factor, "
        "input_width, input_height, output_width, output_height, processing_time_ms, "
        "cloudinary_url, created_at."
    )
    add_bullet(
        "Sessions: session_id (PK), user_id (FK \u2192 Users), jwt_token_hash, ip_address, "
        "user_agent, created_at, expires_at."
    )
    add_p("Relationships:", bold=True)
    add_bullet(
        "Users \u2194 Subscriptions: One-to-One. Each user possesses exactly one active "
        "subscription record. Downgrades and upgrades create new records with updated "
        "tier values."
    )
    add_bullet(
        "Users \u2194 Processing_Logs: One-to-Many. A single user may have hundreds of "
        "processing log entries accumulated over time."
    )
    add_bullet(
        "Users \u2194 Sessions: One-to-Many. A user may have multiple active sessions "
        "across different devices."
    )
    add_figure_placeholder(
        "Entity Relationship Diagram showing Users, Subscriptions, Processing_Logs, and "
        "Sessions entities with their attributes and relationships",
        "7.3"
    )
    add_figure_explanation(
        "Fig. 7.3 presents the ER diagram for the Upscale Pro database. The Users entity "
        "serves as the central hub, linked to Subscriptions via a one-to-one relationship "
        "(each user has exactly one active plan) and to Processing_Logs via a one-to-many "
        "relationship (each upscale operation generates one log entry). The Sessions entity "
        "tracks active JWT sessions per user, enabling forced logout and multi-device "
        "session management. Primary keys are underlined, and foreign key constraints "
        "enforce referential integrity with ON DELETE CASCADE behaviour."
    )
    page_break()


def build_chapter_8():
    """Chapter 8: Implementation and Results (approx 7 pages with screenshots)."""
    add_h("CHAPTER 8: IMPLEMENTATION AND RESULTS", 1)
    add_p(
        "This chapter documents the complete implementation of Upscale Pro, beginning with "
        "project initialisation and environment setup, followed by a detailed walkthrough "
        "of every major application screen. Each screenshot is accompanied by an explanatory "
        "description that identifies the visible UI components, the backend processes they "
        "trigger, and the design rationale behind their layout."
    )

    # ── 8.1 Project Initialisation ──
    add_h("8.1 Project Initialisation and Setup", 2)

    add_h("8.1.1 Project Directory Structure", 3)
    add_p(
        "The Upscale Pro codebase follows a modular directory organisation that reflects "
        "the three-tier architecture described in Chapter 1. The root directory contains "
        "the Node.js backend server, while the client/vite-project subdirectory houses "
        "the React frontend. The modal-serverless directory contains the Python inference "
        "script that executes on Modal\u2019s GPU containers."
    )
    add_code_block(
        "image-resizer/\n"
        "\u251c\u2500\u2500 server.js              # Express entry point\n"
        "\u251c\u2500\u2500 database-pg.js         # PostgreSQL connection & queries\n"
        "\u251c\u2500\u2500 package.json           # Backend dependencies\n"
        "\u251c\u2500\u2500 routes/\n"
        "\u2502   \u251c\u2500\u2500 auth.js            # Registration, login, JWT\n"
        "\u2502   \u251c\u2500\u2500 images.js          # Upload, upscale, resize\n"
        "\u2502   \u251c\u2500\u2500 users.js           # Profile, subscription\n"
        "\u2502   \u251c\u2500\u2500 stripe.js          # Payment integration\n"
        "\u2502   \u2514\u2500\u2500 analytics.js       # Usage statistics\n"
        "\u251c\u2500\u2500 middleware/\n"
        "\u2502   \u251c\u2500\u2500 auth.js            # JWT verification\n"
        "\u2502   \u2514\u2500\u2500 rateLimiter.js     # Request throttling\n"
        "\u251c\u2500\u2500 gpu-provider/\n"
        "\u2502   \u251c\u2500\u2500 index.js           # Provider abstraction\n"
        "\u2502   \u2514\u2500\u2500 modal.js           # Modal.com HTTP client\n"
        "\u251c\u2500\u2500 modal-serverless/\n"
        "\u2502   \u2514\u2500\u2500 app.py             # PyTorch inference + Cloudinary upload\n"
        "\u251c\u2500\u2500 config/\n"
        "\u2502   \u251c\u2500\u2500 cloudinary.js      # CDN configuration\n"
        "\u2502   \u2514\u2500\u2500 upload.js          # Multer file filter\n"
        "\u2514\u2500\u2500 client/vite-project/\n"
        "    \u251c\u2500\u2500 src/\n"
        "    \u2502   \u251c\u2500\u2500 App.jsx          # Root component + routing\n"
        "    \u2502   \u251c\u2500\u2500 pages/           # Page-level components\n"
        "    \u2502   \u251c\u2500\u2500 components/      # Reusable UI components\n"
        "    \u2502   \u251c\u2500\u2500 context/         # React context providers\n"
        "    \u2502   \u2514\u2500\u2500 services/        # API client functions\n"
        "    \u2514\u2500\u2500 index.html"
    )
    add_figure_placeholder(
        "VS Code Explorer panel showing the Upscale Pro project directory tree with "
        "all folders expanded",
        "8.1"
    )
    add_figure_explanation(
        "Fig. 8.1 shows the project directory structure as viewed in Visual Studio Code\u2019s "
        "Explorer panel. The root level contains the Express server entry point (server.js), "
        "the database handler (database-pg.js), and five route modules under the routes/ "
        "directory. The gpu-provider/ directory implements the provider abstraction pattern "
        "that decouples the Node.js server from any specific GPU vendor. The client/vite-project/ "
        "directory contains the React application with separate folders for pages (full-screen "
        "views), components (reusable UI fragments), context (global state), and services "
        "(API call functions)."
    )

    add_h("8.1.2 Starting the Backend Server", 3)
    add_p(
        "The Node.js backend is initialised by executing the server.js entry point. This "
        "script configures Express middleware (CORS, body-parser, cookie-parser), mounts "
        "the route modules, establishes the PostgreSQL connection pool, and begins listening "
        "on the configured port."
    )
    add_code_block(
        "$ npm install          # Install all backend dependencies\n"
        "$ node server.js       # Start the Express API server\n\n"
        "Output:\n"
        "[2026-04-15 10:30:12] Database connected successfully (Neon PostgreSQL)\n"
        "[2026-04-15 10:30:12] Cloudinary configured: cloud_name=upscalepro\n"
        "[2026-04-15 10:30:12] Server running on port 5000\n"
        "[2026-04-15 10:30:12] GPU Provider: Modal.com (endpoint configured)"
    )
    add_figure_placeholder(
        "Terminal window showing Node.js server startup with successful database connection "
        "and port binding messages",
        "8.2"
    )
    add_figure_explanation(
        "Fig. 8.2 captures the terminal output during backend initialisation. The four "
        "log lines confirm that: (1) the Neon PostgreSQL connection pool was established "
        "successfully, (2) Cloudinary API credentials were loaded from environment variables, "
        "(3) the Express server bound to port 5000 without conflicts, and (4) the GPU "
        "provider module detected the Modal.com endpoint configuration. Any failure in "
        "these initialisation steps would produce a clearly labelled error and halt "
        "the server startup."
    )

    add_h("8.1.3 Starting the Frontend Development Server", 3)
    add_p(
        "The React frontend uses Vite as its development server and build tool. Vite provides "
        "near-instantaneous hot module replacement (HMR), reflecting code changes in the "
        "browser within milliseconds without a full page reload."
    )
    add_code_block(
        "$ cd client/vite-project\n"
        "$ npm install          # Install frontend dependencies\n"
        "$ npm run dev          # Start Vite development server\n\n"
        "Output:\n"
        "  VITE v5.2.0  ready in 420 ms\n"
        "  -> Local:   http://localhost:5173/\n"
        "  -> Network: http://192.168.1.5:5173/"
    )
    add_figure_placeholder(
        "Terminal window showing Vite development server startup with local and network URLs",
        "8.3"
    )
    add_figure_explanation(
        "Fig. 8.3 shows the Vite development server startup output. The server compiled "
        "all React components and CSS modules in 420 milliseconds and is accessible at "
        "http://localhost:5173 for local development. The network URL allows testing on "
        "mobile devices connected to the same local network."
    )

    # ── 8.2 Application Walkthrough ──
    add_h("8.2 Application Walkthrough with Snapshots", 2)
    add_p(
        "This section presents a sequential walkthrough of the Upscale Pro user interface, "
        "documenting each major screen that a user encounters from initial visit through "
        "image upscaling and result download."
    )

    add_h("8.2.1 Landing Page (Hero Section)", 3)
    add_figure_placeholder(
        "Upscale Pro landing page showing the hero section with headline text, call-to-action "
        "button, and animated gradient background",
        "8.4"
    )
    add_figure_explanation(
        "Fig. 8.4 displays the Upscale Pro landing page, which is the first screen visible "
        "to new visitors. The hero section features a bold headline (\u201cUpscale Your Images "
        "with AI\u201d), a concise value proposition subtitle, and a prominent call-to-action "
        "button that navigates to the upscale tool. The background employs an animated CSS "
        "gradient that subtly shifts between deep blue and purple tones, establishing a "
        "premium visual identity. Below the fold, feature cards highlight the three primary "
        "selling points: GPU-accelerated processing, before-and-after comparison, and "
        "batch upload capability."
    )

    add_h("8.2.2 User Registration and Login", 3)
    add_figure_placeholder(
        "Registration modal overlay with fields for username, email, and password, "
        "plus a social login option",
        "8.5"
    )
    add_figure_explanation(
        "Fig. 8.5 shows the authentication modal that appears when a user clicks the "
        "\u201cSign Up\u201d or \u201cLog In\u201d button in the navigation header. The modal provides a "
        "tabbed interface switching between registration and login forms. The registration "
        "form collects username, email address, and password. Upon submission, the frontend "
        "sends a POST request to /api/auth/register, which hashes the password with bcrypt, "
        "stores the record in PostgreSQL, and dispatches a verification email containing "
        "a six-digit OTP."
    )

    add_h("8.2.3 Email Verification", 3)
    add_figure_placeholder(
        "Email verification modal with a six-digit OTP input field and resend option",
        "8.6"
    )
    add_figure_explanation(
        "Fig. 8.6 presents the email verification modal that appears immediately after "
        "successful registration. The user enters the six-digit OTP received via email. "
        "The frontend sends this code to /api/auth/verify-email, where the server compares "
        "it against the hashed OTP stored in the database. Upon successful verification, "
        "the user\u2019s is_verified flag is set to true, a JWT is generated, and the user is "
        "redirected to the upscale page. The \u201cResend OTP\u201d link triggers a new email if "
        "the original was not received."
    )

    add_h("8.2.4 Image Upload Interface", 3)
    add_figure_placeholder(
        "Upscale page showing the drag-and-drop upload zone with model selection dropdown "
        "and scale factor toggle",
        "8.7"
    )
    add_figure_explanation(
        "Fig. 8.7 displays the main upscale interface, which is the core functional screen "
        "of the application. The central area contains a drag-and-drop zone (implemented "
        "using HTML5 Drag and Drop API) with a dashed border and an upload icon. Users can "
        "either drag files directly onto this zone or click it to open the native file "
        "picker. Below the upload zone, a dropdown allows selection between \u201cReal-ESRGAN "
        "Pro\u201d (for photographs) and \u201cReal-ESRGAN Anime\u201d (for illustrations). A toggle "
        "switch selects between 2\u00d7 and 4\u00d7 upscaling. The interface dynamically validates "
        "the uploaded image\u2019s dimensions against the tier-specific limits and displays "
        "a warning if the file exceeds the maximum allowed resolution."
    )

    add_h("8.2.5 AI Processing State", 3)
    add_figure_placeholder(
        "Processing state with animated progress indicator, estimated time remaining, "
        "and the uploaded image preview in the background",
        "8.8"
    )
    add_figure_explanation(
        "Fig. 8.8 captures the processing state that the interface enters after the user "
        "clicks the \u201cUpscale\u201d button. A circular progress animation indicates that the "
        "image is being processed on the remote GPU. The estimated completion time is "
        "displayed below the spinner (typically \u201c5\u201310 seconds\u201d). During this phase, the "
        "React component polls the server or waits for the asynchronous HTTP response. "
        "The upload button is disabled to prevent duplicate submissions. If the Modal GPU "
        "returns an error (e.g., OOM), the interface displays a descriptive error message "
        "suggesting the user reduce the input resolution."
    )

    add_h("8.2.6 Before-and-After Comparison (Photographic)", 3)
    add_figure_placeholder(
        "Interactive comparison slider showing the original low-resolution photograph on "
        "the left and the Real-ESRGAN Pro upscaled output on the right",
        "8.9"
    )
    add_figure_explanation(
        "Fig. 8.9 presents the result screen after successful upscaling of a photographic "
        "image using the Real-ESRGAN Pro model at 4\u00d7 magnification. The interface displays "
        "an interactive comparison slider implemented using CSS clip-path and JavaScript "
        "pointer event listeners. Dragging the slider handle to the left reveals more of "
        "the upscaled output; dragging right reveals the original. This component is "
        "implemented in the ImageComparison.jsx file and re-renders only the clip-path "
        "CSS property via React\u2019s state update mechanism, achieving smooth 60fps interaction. "
        "Below the slider, metadata shows the processing time (e.g., \u201c4.2 seconds\u201d), "
        "model used, and output dimensions."
    )

    add_h("8.2.7 Before-and-After Comparison (Anime/Illustration)", 3)
    add_figure_placeholder(
        "Interactive comparison slider showing an anime illustration upscaled with the "
        "Real-ESRGAN Anime model",
        "8.10"
    )
    add_figure_explanation(
        "Fig. 8.10 demonstrates the output of the Real-ESRGAN Anime model applied to a "
        "digital illustration. This model variant is optimised for images with flat colour "
        "regions and bold contour lines. The comparison reveals that the model has sharpened "
        "character outlines, smoothed colour gradient transitions, and eliminated aliasing "
        "artefacts along diagonal edges. The anime model uses a 6-block RRDB architecture "
        "(versus 23 blocks in the Pro model), resulting in faster inference times (typically "
        "2\u20134 seconds) at the cost of slightly less detail reconstruction in photographic "
        "textures."
    )

    add_h("8.2.8 Pricing and Subscription Tiers", 3)
    add_figure_placeholder(
        "Pricing page displaying three subscription cards: Free, Pro, and Business tiers "
        "with feature comparison",
        "8.11"
    )
    add_figure_explanation(
        "Fig. 8.11 shows the subscription pricing page, which presents three tier cards "
        "in a horizontal layout. The Free tier offers three daily upscales with the Anime "
        "model only. The Pro tier unlocks the Real-ESRGAN Pro model, increases the daily "
        "quota to twenty operations, and enables batch processing. The Business tier removes "
        "all quotas and provides API key access for programmatic integration. Each card "
        "lists its features with checkmark icons and includes a call-to-action button that "
        "initiates the Stripe Checkout flow (currently in test mode)."
    )

    add_h("8.2.9 User Profile and Analytics Dashboard", 3)
    add_figure_placeholder(
        "User profile page showing account details, subscription status, and usage analytics "
        "charts",
        "8.12"
    )
    add_figure_explanation(
        "Fig. 8.12 displays the authenticated user\u2019s profile page. The top section shows "
        "the user\u2019s avatar, username, email, and current subscription tier. Below this, "
        "the usage analytics section presents: (1) a daily quota consumption bar showing "
        "remaining upscales, (2) a line chart of processing operations over the past 30 "
        "days, and (3) a breakdown of model usage (Pro vs. Anime) as a donut chart. This "
        "data is retrieved from the /api/analytics endpoint, which aggregates records from "
        "the Processing_Logs table."
    )

    add_h("8.2.10 Batch Processing Interface", 3)
    add_figure_placeholder(
        "Batch processing modal showing a queue of five uploaded images with individual "
        "progress indicators",
        "8.13"
    )
    add_figure_explanation(
        "Fig. 8.13 shows the batch processing interface available to Pro and Business tier "
        "subscribers. Users can select up to ten images simultaneously, which are queued "
        "and processed sequentially by the GPU. Each image in the queue displays its own "
        "status indicator (queued, processing, complete, or failed). The batch processor "
        "is implemented in the BatchProcessor.jsx component, which manages a local state "
        "array of upload objects and dispatches them to the API endpoint one at a time to "
        "avoid overwhelming the GPU concurrency limit."
    )

    add_h("8.2.11 Responsive Mobile Layout", 3)
    add_figure_placeholder(
        "Mobile viewport (375px width) showing the landing page, upload interface, and "
        "comparison slider adapted for touch interaction",
        "8.14"
    )
    add_figure_explanation(
        "Fig. 8.14 demonstrates the responsive design of Upscale Pro across a 375px mobile "
        "viewport. The navigation collapses into a hamburger menu, the upload zone fills "
        "the full screen width, and the comparison slider responds to touch events (touchstart, "
        "touchmove) in addition to mouse events. Media queries in the CSS adjust font sizes, "
        "card layouts, and spacing to ensure readability and usability on small screens."
    )
    page_break()


def build_chapters_7_to_8():
    """Entry point for Chapters 7-8."""
    build_chapter_7()
    build_chapter_8()
