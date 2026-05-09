# Day 1: The Request Lifecycle & How the Internet Works

Today, we will learn how computers talk to each other across the internet using your project as the example.

## Concept: Client-Server Architecture
The internet fundamentally operates on a **Client-Server model**. 
- **Client:** The user's web browser (running your React code in the `client/` folder).
- **Server:** A powerful computer waiting for instructions (running your Node.js code in `server.js` and `routes/`).

## Your Project's Map: React to Node.js
When a user clicks "Upscale Image" on your website, physics and code happen:

### 1. The Client (React frontend)
Look at your frontend components (e.g., `client/src/components/BatchProcessor.jsx` or similar upload components). 
 React gathers the image the user uploaded. It doesn't just "send" it magically; it wraps it in a parcel called `FormData`. 
*   **The Code Concept:** An HTTP `POST` request. This is like sending a registered package. It contains headers (like a return address and authorization tokens) and a body (the image data).
*   **How it travels:** The data goes across fiber optic internet cables as binary data (1s and 0s) seeking out your backend's IP address.

### 2. The Server (Node.js API Gateway)
Your entry point is `server.js`. This file literally listens to a specific "port" (like a door) on the server.
When the `POST` request arrives at the `/api/upscale` door, `server.js` routes it to the specific instructions laid out in `routes/images.js`.

### 3. The API (Application Programming Interface)
An API is just a restaurant menu. Your React app ordered the "Upscale Image" dish.
Inside `routes/images.js`, your server reads the menu order:
```javascript
// A simplified view of what your route looks like:
router.post('/upscale', upload.single('image'), async (req, res) => { ... })
```
- `router.post`: Listens for the POST request.
- `upload.single('image')`: This is `multer` (a middleware). It catches the incoming binary data from the internet and converts it back into a readable file "Buffer" in RAM.

### Study Action:
Open `server.js` and trace where it uses `routes/images.js`. Then open `routes/images.js` and find the `/upscale` route. Notice how it takes an incoming request (`req`) and eventually sends a response (`res`).

**Viva Question to Answer:** "What is an API and how does your React app communicate with your backend?" 
*Answer:* "My React frontend acts as the client, sending an HTTP POST request carrying the image via FormData to my Node.js REST API. Node.js processes the request and sends back a JSON response."