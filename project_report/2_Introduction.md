# 2. Introduction

We rely heavily on digital images today, whether for building websites, sharing on social media, or saving personal photos. But we often run into a common issue: acquiring high-resolution images isn't always possible. Sometimes the original camera was poor, the file was compressed heavily for web transmission, or it's just an old photo. 

To solve this, our project introduces an Image Upscaler Software as a Service (SaaS). It uses serverless GPU acceleration to take a pixelated, low-resolution input and reconstruct it into a sharp, high-resolution output.

## Evolution of Scaling Algorithms

Before modern artificial intelligence took over, image processing relied purely on spatial domain math. If you tried to make an image bigger using traditional techniques like nearest-neighbor or bicubic interpolation, the computer just guessed the missing pixels based on the colors next to them. While this happens almost instantly, the results are usually terrible. The images end up looking blurry, and the true details are completely washed out.

Because interpolation had these hard limits, researchers started looking into learning-based reconstruction. Early on, Convolutional Neural Networks (CNNs) were used to learn how low-res images map to high-res spaces. However, the real breakthrough happened with Generative Adversarial Networks (GANs). Networks like ESRGAN introduced a competitive setup between a Generator and a Discriminator. For this project, we utilize the Real-ESRGAN architecture. Instead of just mathematical smoothing, it simulates real-world camera noise and blur. In doing so, it actively 'hallucinates' and draws incredibly sharp, realistic details that didn't actually exist in the original small file.
