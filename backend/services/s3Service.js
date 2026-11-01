const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const region = process.env.AWS_REGION || 'ap-south-1';
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'ecoswap-product-images';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const isS3Configured = () => {
    return Boolean(accessKeyId && secretAccessKey && bucketName);
};

let s3Client = null;
if (isS3Configured()) {
    s3Client = new S3Client({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
    console.log(`[STaaS] AWS S3 Client initialized for region: ${region}, bucket: ${bucketName}`);
} else {
    console.log('[STaaS] AWS S3 credentials not fully provided; using local fallback mock for development.');
}

// Allowed MIME types for product images
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Multer memory storage configuration
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP images are supported (max 5 MB).'), false);
    }
};

const uploadMiddleware = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
});

/**
 * Uploads an image buffer directly to AWS S3.
 * Returns { imageUrl, s3Key }.
 */
const uploadFileToS3 = async (fileBuffer, originalname, mimetype) => {
    const ext = path.extname(originalname).toLowerCase() || '.jpg';
    const randomHash = crypto.randomBytes(8).toString('hex');
    const s3Key = `items/${Date.now()}-${randomHash}${ext}`;

    if (!isS3Configured()) {
        // Fallback for development if AWS credentials are not yet set
        console.warn(`[STaaS Fallback] AWS credentials missing. Generated simulated cloud key: ${s3Key}`);
        return {
            s3Key,
            imageUrl: `https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600`,
            isSimulated: true,
        };
    }

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
    });

    await s3Client.send(command);

    // Standard public S3 URL format
    const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
    return { imageUrl, s3Key, isSimulated: false };
};

/**
 * Deletes an image object from AWS S3.
 */
const deleteFileFromS3 = async (s3Key) => {
    if (!s3Key || !isS3Configured()) return;

    try {
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
        });
        await s3Client.send(command);
        console.log(`[STaaS] Successfully deleted S3 object: ${s3Key}`);
    } catch (err) {
        console.error(`[STaaS] Failed to delete S3 object ${s3Key}:`, err.message);
    }
};

/**
 * Generates a short-lived presigned download URL for private bucket access.
 */
const getSignedDownloadUrl = async (s3Key, expiresIn = 3600) => {
    if (!s3Key || !isS3Configured()) return null;

    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
        });
        return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (err) {
        console.error(`[STaaS] Failed to generate signed URL for ${s3Key}:`, err.message);
        return null;
    }
};

module.exports = {
    isS3Configured,
    uploadMiddleware,
    uploadFileToS3,
    deleteFileFromS3,
    getSignedDownloadUrl,
    MAX_FILE_SIZE,
    ALLOWED_MIME_TYPES,
};

