# Project Architecture Deep Dive

To defend your project, you must articulate the **Data Flow** and the **Motivation Tooling** (Why you used X instead of Y).

## 1. The Core Infrastructure (The Stack)
*   **Frontend:** React.js (via Vite). Used for component-based UI and virtual DOM to make the before/after image sliders snappy.
*   **Backend:** Node.js / Express.js. Used because it is non-blocking and handles thousands of I/O requests (networking, saving to DB) beautifully.
*   **Database:** Neon (Serverless PostgreSQL). Relational DB chosen because SaaS users, billing, and logs map perfectly to related tables.
*   **ML/Inference Cloud:** Modal.com. Serverless Python environment with access to NVIDIA GPUs (T4/A10G).
*   **Storage:** Cloudinary. Optimized image Content Delivery Network (CDN).

## 2. Step-by-Step Data Flow
**If asked: "Walk me through how your system works."**

1.  **Client Upload:** The user selects a `.jpg` in the React frontend. The frontend checks the file size to save bandwidth, then sends it via an HTTP `POST` request as a `FormData` object to our `/api/upscale` endpoint.
2.  **Backend Ingestion:** The Node.js Express server receives it. A middleware called `multer` holds the image temporarily in RAM (a Buffer) instead of saving it to the server's hard drive to keep the server stateless and fast.
3.  **Validation & Auth:** The server checks the user's JWT (JSON Web Token) to ensure they are logged in, checks their Tier (Free/Pro), and checks if the image dimensions are within safe limits (e.g., < 2048px).
4.  **Queueing:** To prevent overwhelming the GPUs, the request enters a Queue middleware.
5.  **The API Gateway call (The Decoupling):** Node.js acts as a gateway. It fires an API request holding the image buffer to **Modal** (the serverless GPU provider).
6.  **AI Inference (GPU):** Modal boots a Python container with PyTorch. It pushes the image to the GPU's VRAM, runs the Real-ESRGAN matrix multiplications, generates the high-res image, and sends the binary output back to Node.js.
7.  **Storage & DB:** Node.js receives the high-res buffer, uploads it instantly to Cloudinary to get a public URL. It then logs the URL and processing time in the Neon PostgreSQL database.
8.  **Completion:** The Node.js server sends a `200 OK` response back to the React UI containing the Cloudinary URL. The UI renders the result.

## 3. Architectural Design Choices (The "Why")

### Why Serverless GPU instead of local Python scripts?
*   **The Problem:** Running heavy Python AI models on the same server as the Node.js API creates a massive bottleneck. The CPU would hit 100% load, and the server would crash if two users requested an upscale concurrently.
*   **The Solution:** We **decoupled** the system. Node.js only handles lightweight tasks (routing, DB checks). The heavy math is outsourced to a specialized Serverless GPU (Modal). Serverless means we don't pay for an expensive GPU when nobody is using the site, but if 50 people use it at once, it spins up 50 isolated containers instantly.

### Why Real-ESRGAN over Bicubic interpolation?
Bicubic interpolation uses pure math to guess missing pixels (averaging neighboring colours), which results in a blurry image. Real-ESRGAN acts as a Generative Adversarial Network (GAN). It has actually *learned* what edges, textures, and details look like and "hallucinates" high-frequency details (like brick textures or sharp anime lines) to create a photorealistic resolution scaling.