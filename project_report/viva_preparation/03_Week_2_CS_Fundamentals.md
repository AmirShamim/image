# CS Fundamentals Tied to the Project

Examiners map textbook theory to your practical work. Here is how standard CS subjects relate to your Image Upscaler.

## 1. Operating Systems (OS)

*   **Concurrency vs. Parallelism:**
    *   *Concurrency (Node.js):* Node uses a single-threaded Event Loop. When User A requests an upscale, Node passes the task to the GPU and instead of idling/blocking, it concurrently answers User B's request. It handles multiple tasks by interleaving them.
    *   *Parallelism (GPU Inference):* The GPU contains thousands of CUDA cores. When processing an image, it calculates the math for thousands of discrete pixels at the exact same millisecond.
*   **Memory Management (RAM vs. VRAM):**
    *   When the image hits your backend via Multer, it sits in **RAM** (System Memory) as a Buffer. 
    *   To process the image, Modal transfers that data into the Graphic Card's **VRAM** (Video Memory). If we send an image that is 10,000x10,000 pixels, the tensor matrix math will exceed the 16GB limit of a standard T4 GPU VRAM, resulting in an OOM (Out of Memory) kernel panic. This is why we have dimension guardrails in the backend.
*   **Process Isolation:**
    *   In modern OS, we isolate executing programs. Modal utilizes Linux Containers (like Docker) so every Python inference job runs in a sterile, sandboxed file system.

## 2. Computer Organization & Architecture (COA)

*   **CPU vs. GPU architecture:**
    *   *CPU (Central Processing Unit):* Built with a few highly complex, fast cores designed for sequential logic branching (e.g., executing Node.js if/else statements, routing, DB queries).
    *   *GPU (Graphics Processing Unit):* Built with thousands of simpler cores (ALUs) designed explicitly for High-Throughput parallel floating-point operations. Training and inferencing Neural Networks (tensor multiplications) run exponentially faster here.
*   **Amdahl’s Law & Bottlenecks:**
    *   Amdahl’s law pertains to the theoretical speedup of executing a task. By shifting our logic off the CPU-bound monolithic architecture to the GPU, we mitigated our primary I/O bottleneck.

## 3. Object-Oriented Programming (OOPs)

While JavaScript and React heavily leverage functional programming, OOP principles are foundational:
*   **Abstraction:** We abstracted the highly complex Modal/Python PyTorch deployment behind a simple interface `gpuProvider.upscale()`. The rest of the Node application knows nothing about PyTorch; it just knows to expect a URL back.
*   **Encapsulation:** Our classes and modules (like `Queue` or `Auth`) bundle their data (state) and the methods that operate on them together, restricting direct outside manipulation.
*   *General Knowledge Backup:* Remember the definition of Polymorphism (the ability of different objects to respond to the same method call) and Inheritance.

## 4. Programming Fundamentals

*   **Synchronous vs. Asynchronous (`async/await`)**
    *   *Sync:* Code executes line by line. If Line 3 takes 5 seconds, Line 4 must wait.
    *   *Async:* We use `async/await` and Promises in our Node server. When we call `await gpuProvider.upscale()`, Node pauses execution of *that specific function* while waiting for Modal to finish, but continues allowing the server to answer other HTTP user traffic.
*   **RESTful APIs (Representational State Transfer):**
    *   Our app uses REST architectures.
    *   `POST /api/upscale` creates a new resource.
    *   `GET /api/user` fetches a resource.
    *   *Statelessness:* Every API call must contain all data needed to understand the request (hence we send the JWT token on every single request).