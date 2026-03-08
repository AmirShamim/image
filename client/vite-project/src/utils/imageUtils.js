/**
 * Resizes an image using the browser's native HTML5 Canvas.
 * 
 * @param {File} file - The original image File object.
 * @param {Object} options - Resizing options.
 * @param {number} options.width - Target width.
 * @param {number} options.height - Target height.
 * @param {boolean} options.maintainAspectRatio - Whether to preserve aspect ratio.
 * @returns {Promise<File>} - A Promise that resolves to the resized File object.
 */
export const resizeImageClientSide = (file, { width, height, maintainAspectRatio = true }) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            return reject(new Error('No file provided for resizing.'));
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let targetWidth = width;
                let targetHeight = height;

                // Calculate aspect ratio if needed
                if (maintainAspectRatio) {
                    const ratio = Math.min(width / img.width, height / img.height);
                    targetWidth = Math.round(img.width * ratio);
                    targetHeight = Math.round(img.height * ratio);
                }

                // Create canvas and resize
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');

                // High quality setting for canvas
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                // Convert back to File
                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error('Canvas to Blob conversion failed.'));
                    }

                    // Try to preserve original format, fallback to jpeg if unsupported
                    const format = file.type || 'image/jpeg';

                    // Create new filename: original-resized-500x500.ext
                    const nameParts = file.name.split('.');
                    const ext = nameParts.length > 1 ? nameParts.pop() : 'jpg';
                    const baseName = nameParts.join('.');
                    const newFileName = `${baseName}_resized_${targetWidth}x${targetHeight}.${ext}`;

                    const resizedFile = new File([blob], newFileName, {
                        type: format,
                        lastModified: Date.now(),
                    });

                    resolve(resizedFile);
                }, file.type || 'image/jpeg', 0.95); // 0.95 quality for jpeg/webp
            };

            img.onerror = () => reject(new Error('Failed to load image for resizing.'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
    });
};

/**
 * Gets the dimensions of an image file on the client side.
 * @param {File} file 
 * @returns {Promise<{width: number, height: number}>}
 */
export const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = () => reject(new Error('Failed to load image for dimensions'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};
