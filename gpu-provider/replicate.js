/**
 * Replicate GPU Provider (Stub)
 * 
 * Calls the Replicate API for Real-ESRGAN inference.
 * Pricing: ~$0.002 per image (flat rate for official model).
 * 
 * Setup:
 *   1. Sign up at https://replicate.com
 *   2. Get your API token from https://replicate.com/account/api-tokens
 *   3. Set REPLICATE_API_TOKEN in your .env
 *   4. Set GPU_PROVIDER=replicate in your .env
 * 
 * Required env vars:
 *   REPLICATE_API_TOKEN - Your Replicate API token
 */

const fs = require('fs');
const path = require('path');

// Replicate model versions for Real-ESRGAN
const MODEL_VERSIONS = {
    'realesrgan': 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    'realesrgan-anime': 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
};

async function upscale(inputPath, outputPath, options) {
    const { model = 'realesrgan', scale = 4 } = options;

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
        throw new Error(
            'REPLICATE_API_TOKEN not set. ' +
            'Get your token from https://replicate.com/account/api-tokens and set it in .env.'
        );
    }

    console.log(`[Replicate GPU] Creating prediction for model="${model}", scale=${scale}x`);

    // Read image as base64 data URI
    const imageBuffer = fs.readFileSync(inputPath);
    const ext = path.extname(inputPath).slice(1) || 'png';
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const imageDataUri = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    // Create prediction
    const [owner_model, version] = MODEL_VERSIONS[model].split(':');
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            version: version,
            input: {
                image: imageDataUri,
                scale: scale,
                face_enhance: false,
            },
        }),
    });

    if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Replicate API returned ${createResponse.status}: ${errorText}`);
    }

    let prediction = await createResponse.json();

    // Poll for completion (max 2 minutes)
    const startTime = Date.now();
    const timeout = 120000;

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        if (Date.now() - startTime > timeout) {
            throw new Error('Replicate prediction timed out after 2 minutes');
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every 1s

        const pollResponse = await fetch(prediction.urls.get, {
            headers: { 'Authorization': `Bearer ${apiToken}` },
        });
        prediction = await pollResponse.json();
    }

    if (prediction.status === 'failed') {
        throw new Error(`Replicate prediction failed: ${prediction.error}`);
    }

    // Download the output image
    const outputUrl = prediction.output;
    console.log(`[Replicate GPU] Downloading result from: ${outputUrl}`);

    const imageResponse = await fetch(outputUrl);
    if (!imageResponse.ok) {
        throw new Error(`Failed to download result image: ${imageResponse.status}`);
    }

    const resultBuffer = Buffer.from(await imageResponse.arrayBuffer());
    fs.writeFileSync(outputPath, resultBuffer);

    // Get dimensions using sharp
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
