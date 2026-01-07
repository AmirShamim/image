const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
// Set these in your Render dashboard or local .env file:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Upload image to Cloudinary
const uploadToCloudinary = async (filePath, options = {}) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'image-resizer/processed',
            resource_type: 'image',
            ...options
        });
        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Upload profile picture to Cloudinary
const uploadProfilePicture = async (filePath, userId) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'image-resizer/profiles',
            public_id: `user_${userId}`,
            overwrite: true,
            resource_type: 'image',
            transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'face' }
            ]
        });
        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary profile upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return { success: result.result === 'ok' };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return { success: false, error: error.message };
    }
};

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    uploadProfilePicture,
    deleteFromCloudinary,
    isCloudinaryConfigured
};
