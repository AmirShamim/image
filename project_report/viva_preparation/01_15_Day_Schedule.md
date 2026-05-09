# 15-Day Viva Preparation Schedule

This schedule is designed to transition you from "knowing the vibe" of the code to "owning the system architecture" while covering mandatory CS theory required by examiners.

## Week 1: Project Mastery & The "Why"
*Your primary goal this week is to be able to draw your system on a whiteboard from memory and justify every tech choice.*

*   **Day 1: The Request Lifecycle**
    *   Trace the exact path of an image. React Upload -> Axios POST -> Node.js Router -> Multer Buffer -> GPU Provider -> Modal.com -> Cloudinary.
    *   *Action:* Read through `routes/images.js`.
*   **Day 2: Architecture & Decoupling**
    *   Understand monolithic vs. microservices/serverless. Why did you separate Node.js from Python?
    *   *Action:* Read `Week_1_Project_And_Architecture.md`.
*   **Day 3: Database & Auth Concepts**
    *   Understand JWTs (JSON Web Tokens). How are sessions managed without saving session states in memory? 
    *   Review the PostgreSQL schema (Users, Subscriptions, ImageLogs).
*   **Day 4: AI/ML Basics (No complex math needed)**
    *   Difference between Interpolation (Bicubic) and Generative Models (GANs). Define Generator vs. Discriminator basically.
*   **Day 5: Error Handling & Edge Cases**
    *   What happens if a user uploads a 50MB file? (Multer limit). What if Modal times out? Identify where the `try/catch` blocks are.
*   **Day 6: System Limits & Queuing**
    *   Review how you prevent the server from crashing when 100 people click "Upscale" simultaneously (Rate limiters, Redis/In-Memory queue).
*   **Day 7: Rest day & Whiteboard test**
    *   *Action:* Draw the Level 1 and Level 2 DFDs from memory. Tell the story out loud.

---

## Week 2: Core CS Fundamentals (Tied to your project)
*Examiners test theory to ensure you didn't just copy-paste. We will tie classic CS theory directly to what your app actually does.*

*   **Day 8: Operating Systems (OS) - Part 1**
    *   Study Node.js single-threaded event loop vs Multi-threading. 
    *   *Action:* Read the OS section in `Week_2_CS_Fundamentals.md`.
*   **Day 9: Operating Systems (OS) - Part 2**
    *   Study Memory Management: Application RAM vs GPU VRAM. What is an Out of Memory (OOM) error?
*   **Day 10: Computer Organization & Architecture (COA)**
    *   CPU vs. GPU processing. Sequential vs. Parallel execution matrices.
*   **Day 11: Programming Fundamentals & Web**
    *   Synchronous vs. Asynchronous execution (`async/await`, Promises). What is a REST API? Describe HTTP Verbs (GET, POST) and Status Codes (200, 400, 500).
*   **Day 12: Object-Oriented Programming (OOPs)**
    *   How abstraction and encapsulation are used in your system. Classes vs Instances.
*   **Day 13: The "Vibe-Coding" Defense**
    *   *Action:* Read `Vibe_Coding_Defense_Strategy.md`. Practice panning out from granular syntax questions to architectural answers.
*   **Day 14: Mock Viva Answers**
    *   *Action:* Open `Viva_FAQ_And_Mock_Questions.md`. Physically speak the answers as if the professor is in front of you. Do not read in your head—speak.
*   **Day 15: Final Review**
    *   Sleep well. Review your architecture diagrams. Confidence is key.
