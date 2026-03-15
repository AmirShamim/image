/**
 * Modal Serverless GPU Provider (https://modal.com)
 * 
 * Free Tier: $30/mo, scales to 0, bills per-second.
 * 
 * To use this provider:
 * 1. Build and deploy a python image on Modal
 * 2. Get your Endpoint URL
 * 3. Set these in your .env:
 *    GPU_PROVIDER=modal
 *    MODAL_ENDPOINT_URL=https://<your-username>--<function-name>.modal.run
 *    MODAL_API_TOKEN=<your_custom_token> (optional, if you set one up in your python code)
 */

// Uses native fetch (Node 18+ built-in — no extra dependency needed)
const fs = require('fs');

async function upscale(inputPath, outputPath, options) {
    const endpointUrl = process.env.MODAL_ENDPOINT_URL;

    if (!endpointUrl) {
        throw new Error('MODAL_ENDPOINT_URL must be set in .env when using Modal provider.');
    }

    const { model = 'realesrgan', scale = 4 } = options;

    // Read input image as base64
    const imageBuffer = fs.readFileSync(inputPath);
    const base64Image = imageBuffer.toString('base64');

    console.log(`[Modal GPU] Sending ${model} ${scale}x task to Modal...`);

    const headers = { 'Content-Type': 'application/json' };
    if (process.env.MODAL_API_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.MODAL_API_TOKEN}`;
    }

    // Call Modal serverless endpoint
    const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            image: base64Image,
            model: model,
            scale: scale
        })
    });

    if (!response.ok) {
        let errorText = await response.text();
        throw new Error(`Modal API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (!result.success || !result.output_image) {
        throw new Error(result.error || 'Invalid response from Modal format: missing output_image');
    }

    // Decode base64 and save to disk
    const base64Data = result.output_image.replace(/^data:image\/\w+;base64,/, "");
    const outputBuffer = Buffer.from(base64Data, 'base64');

    fs.writeFileSync(outputPath, outputBuffer);
    console.log(`[Modal GPU] Output saved to: ${outputPath}`);

    // Return final details
    const sharp = require('sharp');
    const metadata = await sharp(outputPath).metadata();

    return {
        success: true,
        model: model,
        width: metadata.width,
        height: metadata.height,
    };
}

module.exports = { upscale };
