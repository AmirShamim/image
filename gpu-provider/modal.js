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

const fs = require('fs');
const path = require('path');

// Timeout for Modal calls (cold start + inference can take 30-90s)
const MODAL_TIMEOUT_MS = 180_000; // 3 minutes (covers cold start + large image tiling)
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

/**
 * Fetch with timeout support (AbortController-based)
 */
async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Sleep for ms milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upscale an image via Modal serverless GPU.
 * Requests binary response format for ~2-3x faster transfer vs base64 JSON.
 * 
 * @param {string} inputPath  - Path to the input image
 * @param {string} outputPath - Path to write the output image
 * @param {object} options
 * @param {string} options.model - 'realesrgan' or 'realesrgan-anime'
 * @param {number} options.scale - 2 or 4
 * @param {number} [options.tileSize] - Optional tile size for server-side tiling (default: 512)
 * @returns {Promise<{success: boolean, model: string, width: number, height: number}>}
 */
async function upscale(inputPath, outputPath, options) {
    const endpointUrl = process.env.MODAL_ENDPOINT_URL;

    if (!endpointUrl) {
        throw new Error('MODAL_ENDPOINT_URL must be set in .env when using Modal provider.');
    }

    const { model = 'realesrgan', scale = 4, tileSize = 512 } = options;

    // Read input image as base64
    const imageBuffer = fs.readFileSync(inputPath);
    const base64Image = imageBuffer.toString('base64');

    console.log(`[Modal GPU] Sending ${model} ${scale}x task (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB) to Modal...`);

    const headers = { 'Content-Type': 'application/json' };
    if (process.env.MODAL_API_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.MODAL_API_TOKEN}`;
    }

    const payload = JSON.stringify({
        image: base64Image,
        model: model,
        scale: scale,
        tile_size: tileSize,
        response_format: 'json', // We want JSON back now, which will contain cloud_url
        cloudinary: {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        }
    });

    // Retry loop for cold-start and transient failures
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[Modal GPU] Attempt ${attempt}/${MAX_RETRIES}...`);

            const fetchStart = Date.now();
            const response = await fetchWithTimeout(endpointUrl, {
                method: 'POST',
                headers: headers,
                body: payload,
            }, MODAL_TIMEOUT_MS);

            const fetchTime = Date.now() - fetchStart;
            const contentType = response.headers.get('content-type') || '';
            console.log(`[Modal GPU] Response received in ${(fetchTime / 1000).toFixed(1)}s (status: ${response.status}, type: ${contentType})`);

            if (!response.ok) {
                const errorText = await response.text();

                // 503 = Modal cold start timeout, retry
                if (response.status === 503 && attempt < MAX_RETRIES) {
                    console.warn(`[Modal GPU] 503 (cold start), retrying in ${RETRY_DELAY_MS}ms...`);
                    lastError = new Error(`Modal API error (${response.status}): ${errorText}`);
                    await sleep(RETRY_DELAY_MS);
                    continue;
                }

                throw new Error(`Modal API error (${response.status}): ${errorText}`);
            }

            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            let outputWidth, outputHeight;

            if (contentType.includes('application/json')) {
                const jsonStart = Date.now();
                const result = await response.json();
                console.log(`[Modal GPU] JSON parsed in ${((Date.now() - jsonStart) / 1000).toFixed(1)}s`);

                if (!result.success) {
                    throw new Error(result.error || 'Invalid response from Modal');
                }

                if (result.cloud_url) {
                    // ============== DIRECT CLOUDINARY UPLOAD (fastest path) ==============
                    console.log(`[Modal GPU] Cloudinary URL received: ${result.cloud_url}`);
                    return {
                        success: true,
                        model: model,
                        width: result.output_width,
                        height: result.output_height,
                        cloudUrl: result.cloud_url,
                        cloudPublicId: result.cloud_public_id
                    };
                } else if (result.output_image) {
                    // ============== BASE64 FALLBACK ==============
                    const decodeStart = Date.now();
                    const base64Data = result.output_image.replace(/^data:image\/\w+;base64,/, "");
                    const outputBuffer = Buffer.from(base64Data, 'base64');

                    fs.writeFileSync(outputPath, outputBuffer);
                    console.log(`[Modal GPU] Decoded + saved ${(outputBuffer.length / 1024 / 1024).toFixed(1)}MB in ${((Date.now() - decodeStart) / 1000).toFixed(1)}s`);

                    outputWidth = result.output_width;
                    outputHeight = result.output_height;
                } else {
                    throw new Error('Invalid JSON response format from Modal');
                }
            } else if (contentType.startsWith('image/')) {
                // ============== BINARY RESPONSE FALLBACK ==============
                const bodyStart = Date.now();
                const { finished } = require('stream/promises');
                const { Readable } = require('stream');
                
                const fileStream = fs.createWriteStream(outputPath);
                await finished(Readable.fromWeb(response.body).pipe(fileStream));
                
                const fileSize = fs.statSync(outputPath).size;
                console.log(`[Modal GPU] Binary body received: ${(fileSize / 1024 / 1024).toFixed(1)}MB in ${((Date.now() - bodyStart) / 1000).toFixed(1)}s`);

                outputWidth = parseInt(response.headers.get('x-output-width') || '0', 10);
                outputHeight = parseInt(response.headers.get('x-output-height') || '0', 10);
            }
            // If we get here, it means we did NOT return early from cloudUrl, so a local file was saved
            // If headers missing, read from the file
            if (!outputWidth || !outputHeight) {
                const sharp = require('sharp');
                const metadata = await sharp(outputPath).metadata();
                outputWidth = metadata.width;
                outputHeight = metadata.height;
            }

            console.log(`[Modal GPU] ✅ Saved ${outputWidth}×${outputHeight} to ${outputPath}`);

            return {
                success: true,
                model: model,
                width: outputWidth,
                height: outputHeight,
            };

        } catch (err) {
            lastError = err;

            // AbortError = timeout
            if (err.name === 'AbortError') {
                console.error(`[Modal GPU] Request timed out after ${MODAL_TIMEOUT_MS / 1000}s (attempt ${attempt}/${MAX_RETRIES})`);
                if (attempt < MAX_RETRIES) {
                    await sleep(RETRY_DELAY_MS);
                    continue;
                }
                throw new Error(`Modal GPU timed out after ${MAX_RETRIES} attempts. The image may be too large or the GPU is busy.`);
            }

            // ECONNRESET / ECONNREFUSED = transient network error, retry
            if ((err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNRESET') && attempt < MAX_RETRIES) {
                console.warn(`[Modal GPU] Connection error (${err.code || err.cause?.code}), retrying in ${RETRY_DELAY_MS}ms...`);
                await sleep(RETRY_DELAY_MS);
                continue;
            }

            // Non-retryable error
            throw err;
        }
    }

    throw lastError || new Error('Modal GPU upscale failed after all retries');
}

module.exports = { upscale };
