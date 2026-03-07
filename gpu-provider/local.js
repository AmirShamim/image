/**
 * Local GPU Provider
 * 
 * Uses your local realesrgan-ncnn-vulkan.exe binary with Vulkan GPU acceleration.
 * This is the default provider for development and local demos.
 * 
 * Requirements:
 *   - realesrgan/realesrgan-ncnn-vulkan.exe must exist
 *   - A Vulkan-capable GPU (NVIDIA, AMD, or Intel)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Path to the Real-ESRGAN binary
const REALESRGAN_DIR = path.join(__dirname, '..', 'realesrgan');
const REALESRGAN_EXE = path.join(REALESRGAN_DIR, 'realesrgan-ncnn-vulkan.exe');

// Map model names to Real-ESRGAN model identifiers
const MODEL_MAP = {
    'realesrgan': 'realesrgan-x4plus',           // Best photo quality
    'realesrgan-anime': 'realesrgan-x4plus-anime', // Best anime/art quality
};

/**
 * Upscale an image using the local Real-ESRGAN binary.
 */
async function upscale(inputPath, outputPath, options) {
    const { model = 'realesrgan', scale = 4 } = options;

    // Check binary exists
    if (!fs.existsSync(REALESRGAN_EXE)) {
        throw new Error(`Real-ESRGAN binary not found at: ${REALESRGAN_EXE}`);
    }

    const modelName = MODEL_MAP[model];
    if (!modelName) {
        throw new Error(`Unknown model: ${model}`);
    }

    // Both models only natively support 4x upscaling.
    // For 2x, we upscale 4x then downscale by half.
    const nativeScale = 4;

    // Resolve paths to absolute (server.js passes relative paths like 'uploads/abc')
    const absInputPath = path.resolve(inputPath);
    const absOutputPath = path.resolve(outputPath);

    return new Promise((resolve, reject) => {
        const args = [
            '-i', absInputPath,
            '-o', absOutputPath,
            '-n', modelName,
            '-s', String(nativeScale),
            '-m', path.join(REALESRGAN_DIR, 'models'),
        ];

        console.log(`[Local GPU] Running: realesrgan-ncnn-vulkan ${args.join(' ')}`);

        const proc = spawn(REALESRGAN_EXE, args, {
            timeout: 120000, // 2 minute timeout
        });

        let stderr = '';

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
            console.log(`[Local GPU] ${data.toString().trim()}`);
        });

        proc.on('close', async (code) => {
            if (code !== 0) {
                console.error(`[Local GPU] FAILED with code ${code}. stderr: ${stderr}`);
                return reject(new Error(`Real-ESRGAN exited with code ${code}: ${stderr}`));
            }

            // Use absolute path consistently (binary writes to absOutputPath)
            if (!fs.existsSync(absOutputPath)) {
                return reject(new Error(`Real-ESRGAN completed but output file not found at: ${absOutputPath}`));
            }

            console.log(`[Local GPU] Binary finished successfully, output at: ${absOutputPath}`);

            try {
                // If user requested 2x, downscale the 4x result by half
                if (scale === 2) {
                    const metadata = await sharp(absOutputPath).metadata();
                    const newWidth = Math.round(metadata.width / 2);
                    const newHeight = Math.round(metadata.height / 2);

                    const buffer = await sharp(absOutputPath)
                        .resize(newWidth, newHeight, { kernel: 'lanczos3' })
                        .toBuffer();

                    await sharp(buffer).toFile(absOutputPath);
                }

                // Get final output dimensions
                const finalMeta = await sharp(absOutputPath).metadata();

                resolve({
                    success: true,
                    model: model,
                    width: finalMeta.width,
                    height: finalMeta.height,
                });
            } catch (err) {
                reject(new Error(`Post-processing failed: ${err.message}`));
            }
        });

        proc.on('error', (err) => {
            reject(new Error(`Failed to spawn Real-ESRGAN: ${err.message}`));
        });
    });
}

module.exports = { upscale };
