const SwapRequest = require('../models/SwapRequest');
const Item = require('../models/Item');
const User = require('../models/User');
const { logSecurityEvent } = require('../middleware/securityMiddleware');

/**
 * POST /api/swaps
 * Send a new swap request for an item.
 */
exports.createSwapRequest = async (req, res) => {
    try {
        const { itemId, itemOfferedId, message } = req.body;
        if (!itemId) {
            return res.status(400).json({ message: 'Item ID is required to initiate a swap.' });
        }

        const itemRequested = await Item.findById(itemId);
        if (!itemRequested) {
            return res.status(404).json({ message: 'Requested item not found.' });
        }

        if (itemRequested.status !== 'Available') {
            return res.status(400).json({ message: 'This item is no longer available for exchange.' });
        }

        // Prevent users from swapping with their own items
        if (itemRequested.postedBy && itemRequested.postedBy.toString() === req.user.userId) {
            return res.status(400).json({ message: 'You cannot request a swap on your own listing.' });
        }

        // Determine owner (if postedBy is null, fallback to first admin or steward)
        let ownerId = itemRequested.postedBy;
        if (!ownerId) {
            const fallbackUser = await User.findOne({ role: 'admin' }) || await User.findOne();
            ownerId = fallbackUser ? fallbackUser._id : req.user.userId;
        }

        // Check if there is already a pending swap request for this item from this user
        const existing = await SwapRequest.findOne({
            requester: req.user.userId,
            itemRequested: itemId,
            status: 'Pending',
        });
        if (existing) {
            return res.status(409).json({ message: 'You already have a pending swap request for this item.' });
        }

        // If an offered item was selected, ensure it belongs to the requester and is available
        if (itemOfferedId) {
            const itemOffered = await Item.findById(itemOfferedId);
            if (!itemOffered) {
                return res.status(404).json({ message: 'Offered item not found.' });
            }
            if (itemOffered.postedBy && itemOffered.postedBy.toString() !== req.user.userId) {
                return res.status(403).json({ message: 'You can only offer items you own.' });
            }
            if (itemOffered.status !== 'Available') {
                return res.status(400).json({ message: 'Offered item is no longer available.' });
            }
        }

        const swap = await SwapRequest.create({
            requester: req.user.userId,
            owner: ownerId,
            itemRequested: itemId,
            itemOffered: itemOfferedId || null,
            message: message ? message.trim() : undefined,
        });

        const populatedSwap = await SwapRequest.findById(swap._id)
            .populate('requester', 'name email avatar')
            .populate('owner', 'name email avatar')
            .populate('itemRequested')
            .populate('itemOffered');

        // Real-time broadcast if socket.io is configured
        const io = req.app.get('io');
        if (io) {
            io.emit('swapCreated', {
                swapId: swap._id,
                ownerId: ownerId.toString(),
                itemTitle: itemRequested.title,
            });
        }

        res.status(201).json(populatedSwap);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/swaps/received
 * Get all swap requests received by the current user (as owner).
 */
exports.getReceivedSwaps = async (req, res) => {
    try {
        const swaps = await SwapRequest.find({ owner: req.user.userId })
            .populate('requester', 'name email avatar')
            .populate('itemRequested')
            .populate('itemOffered')
            .sort({ createdAt: -1 });

        res.json(swaps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/swaps/sent
 * Get all swap requests sent by the current user.
 */
exports.getSentSwaps = async (req, res) => {
    try {
        const swaps = await SwapRequest.find({ requester: req.user.userId })
            .populate('owner', 'name email avatar')
            .populate('itemRequested')
            .populate('itemOffered')
            .sort({ createdAt: -1 });

        res.json(swaps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * PUT /api/swaps/:id/status
 * Update the status of a swap request (Accept, Reject, Cancel).
 */
exports.updateSwapStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Accepted', 'Rejected', 'Cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Allowed values: Accepted, Rejected, Cancelled.' });
        }

        const swap = await SwapRequest.findById(req.params.id)
            .populate('itemRequested')
            .populate('itemOffered');

        if (!swap) {
            return res.status(404).json({ message: 'Swap request not found.' });
        }

        const isOwner = swap.owner.toString() === req.user.userId || req.user.role === 'admin';
        const isRequester = swap.requester.toString() === req.user.userId;

        if (status === 'Cancelled') {
            if (!isRequester) {
                return res.status(403).json({ message: 'Only the requester can cancel this swap request.' });
            }
        } else {
            // Accepted or Rejected
            if (!isOwner) {
                return res.status(403).json({ message: 'Only the item owner can accept or reject this request.' });
            }
        }

        swap.status = status;
        await swap.save();

        // If accepted, update item availability status
        if (status === 'Accepted') {
            await Item.findByIdAndUpdate(swap.itemRequested._id || swap.itemRequested, { status: 'Exchanged' });

            if (swap.itemOffered) {
                await Item.findByIdAndUpdate(swap.itemOffered._id || swap.itemOffered, { status: 'Exchanged' });
            }

            // Auto-reject any other pending swaps for this item
            await SwapRequest.updateMany(
                {
                    _id: { $ne: swap._id },
                    itemRequested: swap.itemRequested._id || swap.itemRequested,
                    status: 'Pending',
                },
                { status: 'Rejected' }
            );

            // Audit log
            await logSecurityEvent({
                eventType: 'ROLE_CHANGED', // or general security event
                userId: req.user.userId,
                userEmail: req.user.email,
                ipAddress: req.ip || '',
                userAgent: req.headers['user-agent'] || '',
                status: 'SUCCESS',
                details: `Swap accepted for item: ${swap.itemRequested?.title || swap.itemRequested}`,
            });
        }

        const updated = await SwapRequest.findById(swap._id)
            .populate('requester', 'name email avatar')
            .populate('owner', 'name email avatar')
            .populate('itemRequested')
            .populate('itemOffered');

        // Broadcast status update
        const io = req.app.get('io');
        if (io) {
            io.emit('swapUpdated', {
                swapId: swap._id,
                status: swap.status,
                itemId: swap.itemRequested._id || swap.itemRequested,
            });
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

