/**
 * GPU Provider Router
 * 
 * Reads GPU_PROVIDER env var and delegates to the correct backend.
 * Switch providers by changing ONE env var — no code changes needed.
 * 
 * Usage:
 *   GPU_PROVIDER=local      → Uses local realesrgan-ncnn-vulkan.exe (your GPU)
 *   GPU_PROVIDER=modal      → HTTP call to Modal serverless endpoint
 *   GPU_PROVIDER=replicate  → HTTP call to Replicate API
 */

const localProvider = require('./local');
const modalProvider = require('./modal');
const replicateProvider = require('./replicate');

const providers = {
    local: localProvider,
    modal: modalProvider,
    replicate: replicateProvider,
};

const PROVIDER_NAME = (process.env.GPU_PROVIDER || 'local').toLowerCase();

if (!providers[PROVIDER_NAME]) {
    console.error(`Unknown GPU_PROVIDER: "${PROVIDER_NAME}". Valid options: ${Object.keys(providers).join(', ')}`);
    process.exit(1);
}

const activeProvider = providers[PROVIDER_NAME];
console.log(`[GPU Provider] Using "${PROVIDER_NAME}" backend`);

/**
 * Upscale an image using the active GPU provider.
 * 
 * @param {string} inputPath  - Absolute path to the input image file
 * @param {string} outputPath - Absolute path to write the output image
 * @param {object} options
 * @param {string} options.model - 'realesrgan' or 'realesrgan-anime'
 * @param {number} options.scale - 2 or 4
 * @returns {Promise<{success: boolean, model: string, width: number, height: number, provider: string}>}
 */
async function upscale(inputPath, outputPath, options) {
    const { model = 'realesrgan', scale = 4, tileSize = 512 } = options;

    // Validate model
    const validModels = ['realesrgan', 'realesrgan-anime'];
    if (!validModels.includes(model)) {
        throw new Error(`Invalid model "${model}". Valid options: ${validModels.join(', ')}`);
    }

    // Validate scale
    const validScales = [2, 4];
    if (!validScales.includes(scale)) {
        throw new Error(`Invalid scale ${scale}. Valid options: ${validScales.join(', ')}`);
    }

    console.log(`[GPU Provider] Upscaling with model="${model}", scale=${scale}x, tile=${tileSize}, provider="${PROVIDER_NAME}"`);

    const result = await activeProvider.upscale(inputPath, outputPath, { model, scale, tileSize });

    return {
        ...result,
        provider: PROVIDER_NAME,
    };
}

/**
 * Get info about the current provider.
 */
function getProviderInfo() {
    return {
        name: PROVIDER_NAME,
        models: ['realesrgan', 'realesrgan-anime'],
        scales: [2, 4],
    };
}

module.exports = { upscale, getProviderInfo };
