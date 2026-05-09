# 5. DFD Diagram

## 5.1 Level 0 Data Flow Diagram
The Context Diagram (Level 0) illustrates the holistic interaction between the external entities (User) and the core Image Upscaler System.

```mermaid
graph LR
    User[Client/User] -- Low Resolution Image & Config --> System(Image Upscaler SaaS)
    System -- High Resolution Image URL --> User
```

## 5.2 Level 1 Data Flow Diagram
The Level 1 DFD decomposes the monolithic system into distinct primary subsystems, elucidating the routing of image payloads and metadata.

```mermaid
graph TD
    User[User] -->|Image Upload| Frontend(React Frontend)
    Frontend -->|POST /api/upscale| API(Node.js API Gateway)
    
    API <-->|Validate Auth/Tier| DB[(Neon PostgreSQL)]
    
    API -->|Queue Request & Base64/Buffer| GPU(Modal Serverless GPU)
    GPU -->|PyTorch Inference| GPU
    GPU -->|Upscaled Buffer| API
    
    API -->|Upload Asset| Cloudinary[(Cloudinary Storage)]
    Cloudinary -->|Asset URL| API
    
    API -->|Save Log| DB
    API -->|Return Final URL| Frontend
    Frontend -->|Display Result| User
```

## 5.3 Level 2 Data Flow Diagram (Processing Subsystem)
The Level 2 DFD specifically targets the complex inference pipeline managed asynchronously between the Node.js API and Modal's Python worker.

```mermaid
graph TD
    Input[Incoming API Request] --> Q[Redis/In-Memory Queue Middleware]
    Q --> Limit[Dimension & Rate Limiter]
    Limit --> |Pass| Provider[gpuProvider.upscale interface]
    Provider --> |HTTP POST / Remote Call| Modal[Modal App Entry]
    Modal --> T4[T4/A10G GPU Container]
    T4 --> ESRGAN[Real-ESRGAN Pipeline]
    ESRGAN --> Output[Binary Output Stream]
    Output --> Provider
```
