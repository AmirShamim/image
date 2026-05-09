# 3. Problem Statement

When you stretch a low-resolution image to fit a modern 4K monitor or a high-density smartphone screen, it looks pixelated and blurry. We lose the high-frequency spatial details. If we try to fix this using standard photo editing algorithms (like bicubic upsampling), the software just averages the local pixels together. This doesn't actually add new detail; it simply makes the jagged edges look softer and muddier.

The main problem this project tackles is that classical algorithms simply cannot generate realistic textures when scaling up. We need advanced artificial intelligence to actually recreate those missing pixels. 

However, introducing AI creates a massive second problem: computer hardware bottlenecks. Processing these machine learning models requires heavy-duty Graphics Processing Units (GPUs). If we hardcode an AI model into a standard monolithic web server, the server will freeze up entirely as soon as one person uploads an image. This causes severe scalability issues, high costs, and system crashes if multiple users try to access the site concurrently. Our system needs to solve both the image quality problem and the server bottleneck problem simultaneously.
