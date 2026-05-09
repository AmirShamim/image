# Day 8 to 10: Programming Fundamentals

This guide covers the core programming structures used in modern JavaScript, ensuring you can explain *how* the code parses data step-by-step.

## Concept 1: Asynchronous Programming
Look deeply at `routes/images.js` or `server.js`. Notice the words `async` and `await`.
**Why do we use async/await?**
JavaScript was originally built for web browsers. If a script locked up while waiting for a file to download, the entire webpage would freeze.
1.  **Synchronous code:** Happens line-by-line. Line 2 waits for Line 1 to completely finish.
2.  **Asynchronous code:** If Line 1 is a heavy task (like reaching out to Modal or querying Postgres), we put the word `await` in front of it. This tells Node.js: "Go do this heavy task, but don't freeze the program. Set it aside, keep the server running for other people, and continue this specific function once the heavy task finishes."

In your upscale route:
```javascript
const upscaleResponse = await gpuProvider.upscale({...});
// Node stops reading THIS specific user's file and waits.
// When Modal finishes 5 seconds later, Node resumes and runs the next line:
res.json({ url: upscaleResponse.url });
```

## Concept 2: Object-Oriented Principles (OOPs)
Although we use Functional components in React, we use OOP patterns in the backend configuration.
1.  **Encapsulation:** Look at your `services/email.js` or `gpu-provider/modal.js`. We grouped related functions and configuration variables (like API keys) into specific modules, hiding the complex inner workings from the main `server.js` file.
2.  **Abstraction:** `server.js` doesn't know *how* `auth.js` verifies a token, or *how* Modal runs Python. It just calls a high-level function and trusts the result. We abstracted away the complexity.

## Concept 3: Error Handling
Code breaks. What happens if Modal's server is down? Or if the Neon database restarts?
Look for `try { ... } catch (error) { ... }` blocks in your code.
If we didn't have these, any network failure would throw an "Unhandled Promise Rejection" and your entire Node.js server would crash completely, kicking everyone offline. The `catch` block safely intercepts the crash and sends a clean `500 Internal Server Error` to the React client, which displays a red toast notification.

### Study Action:
Trace an error. Open `routes/images.js`. Look at the `try/catch` block. Pretend `gpuProvider.upscale` returned `null` instead of a URL. Trace how the `throw new Error()` is safely caught and converted into a `res.status(500)` response to the user.

**Viva Question to Answer:** "What is Asynchronous programming and why is it mandatory for this project?"
*Answer:* "Asynchronous programming prevents I/O operations from blocking the main execution thread. Since calling out to the GPU provider takes 5 to 10 seconds, using `async/await` allows Node to 'pause' handling that specific user's request while it concurrently answers other users' requests. If I used synchronous blocking code, the entire application would freeze for 10 seconds for everyone just to process one image."