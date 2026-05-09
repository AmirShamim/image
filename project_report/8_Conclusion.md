# 8. Conclusion

High-density screens are everywhere, but we are still dealing with older, low-resolution images. This creates a constant need for automated, accurate upscaling tools. Through this project, we successfully built and launched a Software as a Service (SaaS) platform that handles this problem by prioritizing both visual quality and system scalability.

The biggest takeaway from our system design is the separation of web logic from machine learning math. By moving away from local CPU processing and standard math algorithms, we utilized advanced neural networks (Real-ESRGAN) hosted entirely on serverless GPU clusters. This effectively solved the typical latency issues and server crashes associated with hosting AI apps. The final product brings image processing times down to under 10 seconds while still generating photorealistic textures.

Ultimately, this project proves how practical it is to combine a standard Node.js API gateway with an externalized Serverless PyTorch backend. It provides a highly stable blueprint for deploying heavy AI models on the web without spending thousands of dollars on idle cloud servers.
