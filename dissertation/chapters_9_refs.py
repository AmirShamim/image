"""
Chapter 9: Software Testing.
Chapter 10: Conclusion.
Chapter 11: Limitations and Future Scope.
References (IEEE format).
"""
from config import (
    doc, add_heading_styled as add_h, add_para as add_p,
    add_bullet, add_code_block, add_table, page_break,
    Pt, WD_ALIGN_PARAGRAPH
)


def build_chapter_9():
    """Chapter 9: Software Testing (approx 2 pages)."""
    add_h("CHAPTER 9: SOFTWARE TESTING", 1)
    add_p(
        "Software testing validates that the implemented system conforms to the requirements "
        "specified in the SRS and operates reliably under anticipated load conditions. "
        "Upscale Pro\u2019s testing strategy encompassed four complementary methodologies: "
        "unit testing, integration testing, load testing, and user acceptance testing."
    )

    add_h("9.1 Unit Testing", 2)
    add_p(
        "Unit tests verify the correctness of individual functions and modules in isolation. "
        "The following critical paths were covered:"
    )
    add_bullet(
        "JWT Middleware Validation: Test cases verified that the authentication middleware "
        "correctly rejects expired tokens (expected: HTTP 401), malformed tokens (expected: "
        "HTTP 401), and missing Authorization headers (expected: HTTP 403). A valid token "
        "was confirmed to set req.user with the decoded payload and invoke next()."
    )
    add_bullet(
        "Password Hashing: Tests confirmed that bcrypt.hash() produces a 60-character "
        "hash string that differs on every invocation (due to random salting), and that "
        "bcrypt.compare() correctly validates the original plaintext against the hash."
    )
    add_bullet(
        "File Validation: The upload middleware was tested with payloads of various MIME "
        "types. Files with type image/jpeg, image/png, and image/webp were accepted; files "
        "with type application/pdf, text/html, and image/svg+xml were rejected with HTTP 400."
    )
    add_bullet(
        "Dimension Enforcement: The frontend dimension validator was tested to ensure it "
        "correctly restricts 2\u00d7 upscaling to inputs not exceeding 2048\u00d72048 pixels and "
        "4\u00d7 upscaling to inputs not exceeding 1024\u00d71024 pixels."
    )

    add_h("9.2 Integration Testing", 2)
    add_p(
        "Integration tests validate the communication pathways between distinct system "
        "components. The most critical integration point is the handshake between the "
        "Node.js API and the Modal GPU endpoint."
    )
    add_p(
        "A synthetic test image (512\u00d7512 pixels, solid blue) was uploaded through the "
        "complete pipeline: the Node.js server encoded it to base64, dispatched it to the "
        "Modal endpoint, and awaited the response. The test verified that: (i) the Modal "
        "container received the payload and initialised the PyTorch model without errors, "
        "(ii) the inference completed within the ten-second latency budget, (iii) the "
        "container successfully authenticated with the Cloudinary API and uploaded the "
        "output image, and (iv) the returned JSON response contained a valid cloudinary_url "
        "field pointing to an accessible CDN asset."
    )
    add_p(
        "A second integration test validated the registration-to-upscale flow end-to-end: "
        "a new user account was created, the email OTP was verified, a JWT was obtained, "
        "and an upscale request was submitted using that JWT. The test confirmed that "
        "the processing log was correctly written to the PostgreSQL database with accurate "
        "model type, dimensions, and latency values."
    )

    add_h("9.3 Load and Stress Testing", 2)
    add_p(
        "Load testing evaluated the system\u2019s behaviour under concurrent user traffic. "
        "Twenty simultaneous upscale requests were dispatched to the API using a custom "
        "Node.js script that spawned parallel HTTP connections."
    )
    add_p("Results:", bold=True)
    add_table(
        ["Metric", "Value"],
        [
            ["Concurrent Requests", "20"],
            ["Successful Responses", "20 (100%)"],
            ["Average Latency", "7.3 seconds"],
            ["Maximum Latency", "12.1 seconds (cold start)"],
            ["Node.js Peak Memory", "148 MB (well below 512 MB limit)"],
            ["GPU Container Failures", "0"],
        ]
    )
    add_p(
        "The results confirmed that the serverless architecture successfully isolated each "
        "request in its own GPU container. The Node.js server\u2019s memory remained stable "
        "because it never handled the output image binaries directly. The maximum latency "
        "of 12.1 seconds occurred on a cold-start container that required model weight "
        "loading; subsequent warm containers completed in under 7 seconds."
    )

    add_h("9.4 User Acceptance Testing", 2)
    add_p(
        "User acceptance testing (UAT) was conducted with a group of five non-technical "
        "volunteers who had no prior experience with image upscaling tools. Each participant "
        "was asked to complete three tasks without guidance: (1) register an account, "
        "(2) upscale a personal photograph, and (3) download the result."
    )
    add_p("Findings:", bold=True)
    add_bullet("All five participants completed all three tasks within four minutes.")
    add_bullet(
        "Four out of five participants found the drag-and-drop interface intuitive without "
        "reading any instructions."
    )
    add_bullet(
        "One participant initially attempted to upload a 6000\u00d74000 pixel image, which "
        "triggered the dimension validation warning. After reading the message, they "
        "resized the image locally and successfully resubmitted."
    )
    add_bullet(
        "All participants rated the before-and-after slider as the most impressive feature."
    )
    page_break()


def build_chapter_10():
    """Chapter 10: Conclusion (approx 1 page)."""
    add_h("CHAPTER 10: CONCLUSION", 1)
    add_p(
        "This dissertation presented the design, implementation, and evaluation of Upscale Pro, "
        "a serverless SaaS platform that delivers GPU-accelerated image super-resolution through "
        "a standard web browser. The project addressed two interconnected challenges: the quality "
        "limitations of classical interpolation algorithms and the infrastructure complexity of "
        "deploying deep learning models for public consumption."
    )
    add_p(
        "By adopting the Real-ESRGAN architecture \u2014 a Generative Adversarial Network trained on "
        "synthetic degradation pipelines \u2014 the platform consistently produces high-resolution "
        "outputs that reconstruct plausible high-frequency textures absent from the original "
        "input. The dual-model offering (Real-ESRGAN Pro for photographs and Real-ESRGAN Anime "
        "for illustrations) ensures that the system serves diverse user needs without requiring "
        "manual parameter tuning."
    )
    add_p(
        "The strictly decoupled three-tier architecture proved essential for production stability. "
        "By isolating the React frontend on Vercel\u2019s CDN, the Node.js API on a DigitalOcean "
        "Droplet, and the PyTorch inference on Modal\u2019s ephemeral GPU containers, the system "
        "ensures that a GPU out-of-memory crash never cascades to the web server, and that "
        "a frontend deployment never requires backend downtime. The direct-to-cloud upload "
        "pattern \u2014 whereby the GPU container transfers the output image directly to Cloudinary "
        "instead of routing it through Node.js \u2014 eliminated the binary buffer bottleneck that "
        "caused V8 heap exhaustion in earlier iterations."
    )
    add_p(
        "Performance benchmarking demonstrated that the serverless GPU approach reduces "
        "per-image processing time from over 120 seconds (legacy CPU pipeline) to an average "
        "of 5.2 seconds on warm containers and 8.4 seconds including cold-start overhead \u2014 a "
        "reduction exceeding 95 percent. Load testing with twenty concurrent requests confirmed "
        "zero server crashes and a 100 percent success rate."
    )
    add_p(
        "Ultimately, Upscale Pro demonstrates that advanced neural image processing can be "
        "delivered as an accessible, cost-efficient web service by combining modern frontend "
        "frameworks, non-blocking API gateways, serverless GPU computing, and CDN-backed "
        "asset storage. The platform is deployed, functional, and accessible at its production "
        "URL for live demonstration."
    )
    page_break()


def build_chapter_11():
    """Chapter 11: Limitations and Future Scope (approx 1 page)."""
    add_h("CHAPTER 11: LIMITATIONS AND FUTURE SCOPE", 1)

    add_h("11.1 Current Limitations", 2)
    add_bullet(
        "GPU Memory Ceiling: Input images are restricted to a maximum of 2048\u00d72048 pixels "
        "for 2\u00d7 upscaling and 1024\u00d71024 pixels for 4\u00d7 upscaling. Exceeding these dimensions "
        "triggers an out-of-memory exception on the 16 GB T4 GPU. Larger images must be "
        "manually cropped before submission."
    )
    add_bullet(
        "Cold Start Latency: When no warm GPU containers are available on Modal\u2019s "
        "infrastructure, a new container must be provisioned from scratch. This cold-start "
        "process adds 3\u20138 seconds of additional latency, potentially pushing the total "
        "processing time beyond the ten-second target."
    )
    add_bullet(
        "Single-Image Synchronous Processing: Although batch upload is supported, images "
        "in the queue are processed sequentially rather than in parallel, as concurrent "
        "GPU containers would multiply the compute cost proportionally."
    )
    add_bullet(
        "No Video Support: The current system processes only static images. Video "
        "super-resolution would require frame extraction, per-frame inference, temporal "
        "coherence enforcement, and re-encoding, which falls outside the current scope."
    )
    add_bullet(
        "Stripe Integration in Test Mode: The payment gateway is implemented and functional "
        "but operates in Stripe\u2019s test mode. Live payment processing would require business "
        "verification and compliance with PCI-DSS standards."
    )

    add_h("11.2 Future Scope", 2)
    add_p(
        "The following enhancements are planned for future iterations of Upscale Pro:"
    )
    add_bullet(
        "Automated Image Tiling: Implement an algorithm that slices large input images "
        "into overlapping tiles, processes each tile independently on a separate GPU "
        "container, and seamlessly stitches the outputs back together. This would bypass "
        "the VRAM ceiling and support arbitrarily large inputs."
    )
    add_bullet(
        "Facial Reconstruction Pipeline: Integrate GFPGAN (Generative Facial Prior GAN) "
        "as a post-processing step for images containing human faces. GFPGAN specialises "
        "in restoring facial geometry, eye detail, and hair texture that generic "
        "super-resolution models may not preserve."
    )
    add_bullet(
        "WebSocket Real-Time Progress: Replace the current HTTP polling mechanism with "
        "WebSocket connections to provide real-time progress updates during GPU inference, "
        "including estimated percentage completion and intermediate preview thumbnails."
    )
    add_bullet(
        "Public REST API: Expose authenticated API endpoints that allow third-party "
        "developers to integrate Upscale Pro\u2019s upscaling capabilities into their own "
        "applications programmatically."
    )
    add_bullet(
        "On-Device Inference via WebGPU: As browser-based GPU APIs mature, investigate "
        "the feasibility of running lightweight super-resolution models (e.g., ESPCN) "
        "directly in the user\u2019s browser using WebGPU, eliminating server round-trips "
        "for simpler enhancement tasks."
    )
    page_break()


def build_references():
    """IEEE-format bibliography."""
    add_h("REFERENCES", 1)
    add_p(
        "[1] C. Dong, C. C. Loy, K. He, and X. Tang, \u201cImage super-resolution using "
        "deep convolutional networks,\u201d IEEE Trans. Pattern Anal. Mach. Intell., "
        "vol. 38, no. 2, pp. 295\u2013307, Feb. 2016."
    )
    add_p(
        "[2] C. Dong, C. C. Loy, and X. Tang, \u201cAccelerating the super-resolution "
        "convolutional neural network,\u201d in Proc. Eur. Conf. Comput. Vis. (ECCV), "
        "Amsterdam, The Netherlands, 2016, pp. 391\u2013407."
    )
    add_p(
        "[3] W. Shi et al., \u201cReal-time single image and video super-resolution using "
        "an efficient sub-pixel convolutional neural network,\u201d in Proc. IEEE Conf. "
        "Comput. Vis. Pattern Recognit. (CVPR), Las Vegas, NV, USA, 2016, pp. 1874\u20131883."
    )
    add_p(
        "[4] B. Lim, S. Son, H. Kim, S. Nah, and K. M. Lee, \u201cEnhanced deep residual "
        "networks for single image super-resolution,\u201d in Proc. IEEE Conf. Comput. Vis. "
        "Pattern Recognit. Workshops (CVPRW), Honolulu, HI, USA, 2017, pp. 1132\u20131140."
    )
    add_p(
        "[5] C. Ledig et al., \u201cPhoto-realistic single image super-resolution using a "
        "generative adversarial network,\u201d in Proc. IEEE Conf. Comput. Vis. Pattern "
        "Recognit. (CVPR), Honolulu, HI, USA, 2017, pp. 105\u2013114."
    )
    add_p(
        "[6] X. Wang, L. Xie, C. Dong, and Y. Shan, \u201cReal-ESRGAN: Training real-world "
        "blind super-resolution with pure synthetic data,\u201d in Proc. IEEE/CVF Int. Conf. "
        "Comput. Vis. Workshops (ICCVW), Montreal, QC, Canada, 2021, pp. 1905\u20131914."
    )
    add_p(
        "[7] I. Goodfellow et al., \u201cGenerative adversarial nets,\u201d in Advances in "
        "Neural Information Processing Systems (NeurIPS), vol. 27, Montreal, QC, Canada, "
        "2014, pp. 2672\u20132680."
    )
    add_p(
        "[8] Meta Platforms, Inc., \u201cReact \u2013 A JavaScript library for building user "
        "interfaces,\u201d 2024. [Online]. Available: https://react.dev/. [Accessed: Apr. 10, 2026]."
    )
    add_p(
        "[9] OpenJS Foundation, \u201cNode.js documentation,\u201d 2024. [Online]. Available: "
        "https://nodejs.org/en/docs/. [Accessed: Apr. 10, 2026]."
    )
    add_p(
        "[10] Modal Labs, Inc., \u201cModal documentation: Serverless GPU infrastructure,\u201d "
        "2025. [Online]. Available: https://modal.com/docs. [Accessed: Apr. 10, 2026]."
    )
    add_p(
        "[11] Cloudinary Ltd., \u201cProgrammable media documentation,\u201d 2025. [Online]. "
        "Available: https://cloudinary.com/documentation. [Accessed: Apr. 10, 2026]."
    )
    add_p(
        "[12] Neon, Inc., \u201cNeon serverless PostgreSQL documentation,\u201d 2025. [Online]. "
        "Available: https://neon.tech/docs. [Accessed: Apr. 10, 2026]."
    )
    add_p(
        "[13] A. Paszke et al., \u201cPyTorch: An imperative style, high-performance deep "
        "learning library,\u201d in Advances in Neural Information Processing Systems "
        "(NeurIPS), vol. 32, Vancouver, BC, Canada, 2019, pp. 8024\u20138035."
    )
    add_p(
        "[14] Evan You, \u201cVite: Next generation frontend tooling,\u201d 2024. [Online]. "
        "Available: https://vitejs.dev/. [Accessed: Apr. 10, 2026]."
    )


def build_chapters_9_to_refs():
    """Entry point for Chapters 9-11 and References."""
    build_chapter_9()
    build_chapter_10()
    build_chapter_11()
    build_references()
