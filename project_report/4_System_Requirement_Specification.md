# 4. System Requirement Specification

## 4.1 Hardware Requirements
- **Client Side:** standard consumer-grade PC/Mobile with web browser support.
- **Server Side Layer:** Lightweight cloud nodes (DigitalOcean) for Node.js API hosting.
- **Inference Hardware:** Ephemeral, Serverless NVIDIA T4 or A10G GPU nodes provided via Modal.com for sub-10 second AI inferencing.

## 4.2 Software Technology Stack
The implementation marries modern JavaScript ecosystem agility with raw PyTorch-based environments for isolated processing.
- **Frontend Stack:** React (Vite environment), utilizing context routers for states and Virtual DOM rendering to provide rapid side-by-side visual image comparisons.
- **Backend Server:** Node.js encapsulating an Express.js API gateway—handling authentication, file payload sanitization, JWT authorization layer, and Queue orchestration.
- **Data Persistence:** Neon Serverless PostgreSQL for user states, tier records, and Stripe billing limits. 
- **Storage:** Cloudinary cloud storage arrays for retaining processed High-Resolution JPEGs.
- **AI Processing:** Modal Serverless Python containers operating PyTorch tensor math and the Real-ESRGAN weights.

## 4.3 Functional Requirements
1. The system must intake `.jpg`, `.jpeg`, and `.png` file clusters.
2. The user interface must limit payload dimension to 2048px (2x upscaling) or 1024px (4x upscaling) prior to transmission to mitigate GPU out-of-memory parameters.
3. The API gateway must decouple the incoming HTTP web socket from the GPU subprocess and maintain asynchronous queuing logic.
4. The system must present visual proof variants of the finalized rendered image via interactive web displays.
