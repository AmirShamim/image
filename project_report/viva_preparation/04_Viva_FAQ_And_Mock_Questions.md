# Project Viva FAQ & Mock Questions

Have a friend or family member strictly ask you these questions. Speak the answers completely out loud.

**Q1: Why did you choose Node.js for the backend if your machine learning model is written in Python?**
*Answer:* "I needed the backend to act as an API gateway. Node.js is non-blocking and handles thousands of concurrent I/O requests incredibly well. If I ran the heavy Python ML models on the same server handling the web requests, the CPU would block, and the website would freeze. So, I decoupled them. Node.js handles the fast web routing, and it outsources the heavy ML calculation to a dedicated Serverless Python GPU instance."

**Q2: What is the difference between a traditional algorithm (like Bicubic scaling) and your AI model?**
*Answer:* "Traditional mathematical interpolation just averages neighboring pixels. If you upscale a blurry image, it just makes a larger blurry image. My app utilizes Real-ESRGAN, which is a Generative Adversarial Network. It doesn't just guess math; it has been trained on real-world degradation and actually 'hallucinates' or generates realistic textures—like brick patterns or sharp vector lines—that didn't exist in the low-res image."

**Q3: Explain how your database is structured.**
*Answer:* "It's a normalized relational structure using PostgreSQL hosted on Neon. We have three primary entities: Users (for auth), Subscriptions (tracking Stripe billing tiers like Free/Pro), and ImageLogs (which stores the metadata, processing latency, and Cloudinary URLs of every generation)."

**Q4: What happens if 500 users upload an image at the exact same millisecond?**
*Answer:* "The Node.js server receives them concurrently. It places the computational requests into an internal Queue mechanism. Because Modal.com is a serverless architecture, it will elastically spin up dozens of isolated GPU containers on demand to process the queue in parallel, meaning the main web server never crashes under the load."

**Q5: Why did you use React instead of just plain HTML/JS?**
*Answer:* "React uses a virtual DOM, which lets me update specific components—like the before/after image comparison slider and the UI loading state matrices—instantly without reloading the page. It makes for a modern Single Page Application (SPA) experience."

**Q6: I see you used JWTs. How does JWT authentication work?**
*Answer:* "JWT stands for JSON Web Token. Instead of the server remembering a session ID in its active memory (which is hard to scale), the server signs a cryptographic token upon login and gives it to the client. The React client sends this token back in the Authorization header on every request (like uploading an image). Node.js mathematically validates the signature to ensure the user is legit."

**Q7: Did you train the AI model yourself?**
*Answer:* "No, the scope of this project was architecting a scalable SaaS ecosystem. I utilized pre-trained weights for Real-ESRGAN and focused my engineering efforts on optimizing the deployment, building the API bridge, ensuring sub-10 second execution via serverless GPUs, and developing the full-stack user application."

**Q8: What is your project's biggest limitation?**
*Answer:* "GPU VRAM constraints. If a user uploads an inherently massive panoramic file, multiplying those pixel tensors will cause a hardware out-of-memory crash. Therefore, the system currently employs strict dimension gatekeeping, rejecting payloads above specific resolutions depending on the upscale multiplier."