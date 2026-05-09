# Client-Side vs Server-Side Optimization (The Resizer)

While the heavy AI Upscaler runs on a serverless GPU, your standard image resizing feature runs entirely in the user's browser (Client-Side). 

This is a **major architectural strength** that you should definitely mention in your viva. It proves you understand cost optimization and system design.

## 1. How Client-Side Resizing Works
When a user goes to your React `/resize` route:
1. They upload an image from their local machine.
2. React loads this image into the browser's memory using standard Web APIs (like `FileReader` or `URL.createObjectURL()`).
3. JavaScript uses the browser's built-in **HTML5 Canvas** API to redraw the image at the new width and height.
4. It converts the canvas back into a downloadable image file for the user.

**Zero data is sent to your Node.js or Modal servers during this process.**

## 2. Why this is an Excellent Design Choice
If an examiner asks: *"Why didn't you send the image to Node.js to resize it?"*

You explain the benefits:
*   **Zero Server Cost:** Running Node.js computing power costs money. If 1,000 people resize an image, your backend doesn't even notice. The user's own computer does the work for free.
*   **Zero Bandwidth Costs:** Uploading and downloading large images takes time and internet data. By keeping it localized to the browser, the process is instantaneous.
*   **Data Privacy:** Since it's done locally, the user never actually transmits their personal images over the internet.
*   **Separation of Concerns:** You correctly identified that simple algorithmic tasks (like bicubic scaling/downsizing) belong in the browser, while complex neural network tasks (Real-ESRGAN upscaling) belong on a GPU.

## 3. The Viva Defense for the Resizer
**Question:** *"I see you have two main features: Resizing and Upscaling. How does the data flow differ between them?"*

**Answer:** *"They work on completely different paradigms based on computing requirements. The Resizer is 100% client-side. The image is drawn onto an HTML5 Canvas within React to adjust dimensions locally, saving server bandwidth and ensuring instant response times. The Upscaler, however, requires AI model inference. Specifically, it involves billions of tensor multiplications across neural networks, which would freeze a standard web browser. Therefore, the Upscaler feature sends the payload across the network to our Model backend to utilize NVIDIA GPUs."*
