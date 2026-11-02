const Item = require('../models/Item');
const User = require('../models/User');
const { uploadFileToS3, deleteFileFromS3 } = require('../services/s3Service');
const { logSecurityEvent } = require('../middleware/securityMiddleware');

/**
 * Upload an image file directly to AWS S3.
 */
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded.' });
        }

        const result = await uploadFileToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        res.status(200).json({
            message: 'Image uploaded successfully to AWS S3.',
            imageUrl: result.imageUrl,
            s3Key: result.s3Key,
            isSimulated: result.isSimulated,
        });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Image upload failed.' });
    }
};

exports.getItems = async (req, res) => {
    try {
        const filter = {};
        if (req.query.userId) {
            filter.postedBy = req.query.userId;
        }
        const items = await Item.find(filter).populate('postedBy', 'name email role').sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createItem = async (req, res) => {
    try {
        const itemData = {
            ...req.body,
            title: req.body.title?.trim(),
            description: req.body.description?.trim(),
            location: req.body.location?.trim(),
            imageUrl: req.body.imageUrl?.trim(),
            s3Key: req.body.s3Key?.trim() || '',
            contact: req.body.contact?.trim().toLowerCase() || req.user.email,
            postedBy: req.user.userId,
            price: ['Sell', 'Rent'].includes(req.body.transactionType) ? Number(req.body.price || 0) : 0,
            tags: Array.isArray(req.body.tags) ? req.body.tags.map(tag => String(tag).trim()).filter(Boolean) : [],
        };
        const item = new Item(itemData);
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        
        const isOwner = item.postedBy && item.postedBy.toString() === req.user.userId;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'You can only update items you posted.' });
        }

        const allowedUpdates = [
            'title',
            'description',
            'category',
            'condition',
            'location',
            'imageUrl',
            's3Key',
            'contact',
            'status',
            'transactionType',
            'price',
            'tags',
            'urgent'
        ];

        // Clean up old S3 image if a new image was uploaded
        if (req.body.s3Key && item.s3Key && req.body.s3Key !== item.s3Key) {
            await deleteFileFromS3(item.s3Key);
        }

        allowedUpdates.forEach((key) => {
            if (req.body[key] !== undefined) item[key] = req.body[key];
        });

        if (!['Sell', 'Rent'].includes(item.transactionType)) item.price = 0;
        const updatedItem = await item.save();

        if (isAdmin && !isOwner) {
            await logSecurityEvent({
                eventType: 'ADMIN_ITEM_UPDATED',
                userId: req.user.userId,
                userEmail: req.user.email,
                ipAddress: req.ip || '',
                userAgent: req.headers['user-agent'] || '',
                status: 'SUCCESS',
                details: `Admin updated listing "${item.title}" (status: ${item.status})`,
            });
        }

        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        
        const isOwner = item.postedBy && item.postedBy.toString() === req.user.userId;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'You can only delete items you posted.' });
        }

        // Delete associated S3 object if present
        if (item.s3Key) {
            await deleteFileFromS3(item.s3Key);
        }

        await item.deleteOne();

        if (isAdmin && !isOwner) {
            await logSecurityEvent({
                eventType: 'ADMIN_ITEM_DELETED',
                userId: req.user.userId,
                userEmail: req.user.email,
                ipAddress: req.ip || '',
                userAgent: req.headers['user-agent'] || '',
                status: 'SUCCESS',
                details: `Admin deleted listing "${item.title}" (ID: ${item._id})`,
            });
        }

        res.json({ message: 'Item deleted and associated cloud assets purged.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/items/:id/wishlist
 * Toggle an item in the current user's Wishlist.
 */
exports.toggleWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const itemId = req.params.id;
        const exists = user.wishlist.some(id => id.toString() === itemId);
        let saved = false;

        if (exists) {
            user.wishlist = user.wishlist.filter(id => id.toString() !== itemId);
            saved = false;
        } else {
            user.wishlist.push(itemId);
            saved = true;
        }

        await user.save();
        res.json({
            saved,
            wishlist: user.wishlist,
            message: saved ? 'Added to Wishlist!' : 'Removed from Wishlist.'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/items/wishlist
 * Get all items saved in current user's Wishlist.
 */
exports.getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('wishlist');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(user.wishlist || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
