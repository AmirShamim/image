# 1. Objective

The main goal of this project is to build and deploy a web application that scales up small images without losing quality. Instead of using standard math algorithms, the system uses Generative Adversarial Networks (GANs)—specifically the Real-ESRGAN model—to handle the heavy lifting. By wrapping this into a web interface, anyone can access advanced AI upscaling easily without needing a powerful computer.

The specific objectives we focused on are:
1. Building a complete SaaS platform using React.js for the frontend, Node.js for the backend API, and a serverless cloud environment for the heavy machine learning tasks.
2. Keeping the wait times as low as possible. We aimed for sub-10 second processing by shifting the PyTorch workload to Modal.com, which offers cold-start optimized GPUs.
3. Creating a stable and secure backend that will not crash when multiple people upload images at the exact same time.
4. Setting up a tiered user system. We linked PostgreSQL to our app to manage Free and Pro tiers, routing users to different AI models (like Real-ESRGAN Pro vs. Anime) based on their account limits.
