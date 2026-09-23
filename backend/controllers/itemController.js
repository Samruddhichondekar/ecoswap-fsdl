const Item = require('../models/Item');

exports.getItems = async (req, res) => {
    try {
        const filter = {};
        if (req.query.userId) {
            filter.postedBy = req.query.userId;
        }
        const items = await Item.find(filter).sort({ createdAt: -1 });
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
        if (item.postedBy && item.postedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You can only update items you posted.' });
        }

        const allowedUpdates = [
            'title',
            'description',
            'category',
            'condition',
            'location',
            'imageUrl',
            'contact',
            'status',
            'transactionType',
            'price',
            'tags',
            'urgent'
        ];

        allowedUpdates.forEach((key) => {
            if (req.body[key] !== undefined) item[key] = req.body[key];
        });

        if (!['Sell', 'Rent'].includes(item.transactionType)) item.price = 0;
        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        if (item.postedBy && item.postedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You can only delete items you posted.' });
        }
        await item.deleteOne();
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
