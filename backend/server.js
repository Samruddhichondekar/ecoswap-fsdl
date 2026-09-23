const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

const itemRoutes = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');
const securityRoutes = require('./routes/securityRoutes');
const Item = require('./models/Item');

const app = express();
const server = http.createServer(app);

// ── Socket.IO ──────────────────────────────────────────────────
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

let connectedClients = 0;
io.on('connection', (socket) => {
    connectedClients++;
    console.log(`[WS] Client connected: ${socket.id} (total: ${connectedClients})`);
    io.emit('clientCount', connectedClients);

    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`[WS] Client disconnected: ${socket.id} (total: ${connectedClients})`);
        io.emit('clientCount', connectedClients);
    });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);

// View increment — broadcasts real-time update to all clients
app.post('/api/items/:id/views', async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { returnDocument: 'after' }
        );
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Broadcast to ALL connected clients
        io.emit('viewUpdate', { itemId: item._id.toString(), views: item.views });

        res.json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error updating views' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', clients: connectedClients, timestamp: new Date().toISOString() });
});

// ── Seed Data ──────────────────────────────────────────────────
const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
};

const seedDatabase = async () => {
    const existingCount = await Item.countDocuments();
    if (existingCount > 0) {
        console.log(`Seed skipped: ${existingCount} item(s) already exist.`);
        return;
    }

    const dummyData = [
        {
            title: "Engineering Mathematics 3 (MU)",
            category: "Books",
            condition: "Good",
            transactionType: "Donate",
            tags: ["Maths", "Engineering", "MU"],
            location: "Vashi Railway Station",
            description: "Well-maintained MU syllabus book, useful for exams.",
            contact: "rahul.patil23@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(0),
        },
        {
            title: "Casio Scientific Calculator FX-991ES",
            category: "Electronics",
            condition: "Excellent",
            transactionType: "Barter",
            tags: ["Calculator", "Engineering"],
            location: "College Campus Gate 1",
            description: "Working perfectly, used for semester exams.",
            contact: "sneha.sharma21@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?w=800&q=80",
            urgent: true,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(0),
        },
        {
            title: "Steel Water Bottle 1L",
            category: "Daily Use",
            condition: "Good",
            transactionType: "Donate",
            tags: ["Bottle", "Eco"],
            location: "Hostel Block A",
            description: "Reusable steel bottle, no leakage.",
            contact: "amit.verma19@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(1),
        },
        {
            title: "Data Structures Notes",
            category: "Books",
            condition: "Good",
            transactionType: "Donate",
            tags: ["DSA", "Notes"],
            location: "Library 2nd Floor",
            description: "Handwritten notes with diagrams.",
            contact: "priya.jadhav22@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80",
            urgent: true,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(2),
        },
        {
            title: "Boat Wired Earphones",
            category: "Electronics",
            condition: "Fair",
            transactionType: "Barter",
            tags: ["Audio"],
            location: "Panvel Bus Stop",
            description: "Working condition, good bass.",
            contact: "rohit.more20@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&q=80",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(3),
        },
        {
            title: "Engineering Drawing Drafter",
            category: "Daily Use",
            condition: "Good",
            transactionType: "Donate",
            tags: ["Drawing", "Tools"],
            location: "Workshop Lab",
            description: "Useful for first-year students.",
            contact: "akash.nair19@fcrit.ac.in",
            imageUrl: "https://m.media-amazon.com/images/I/61hHy1Nh6qL._SL1445_.jpg",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(3),
        },
        {
            title: "Laptop Cooling Pad",
            category: "Electronics",
            condition: "Good",
            transactionType: "Barter",
            tags: ["Laptop"],
            location: "Hostel Block B",
            description: "Keeps laptop cool, USB powered.",
            contact: "neha.kulkarni21@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(5),
        },
        {
            title: "Programming in C Book",
            category: "Books",
            condition: "Good",
            transactionType: "Donate",
            tags: ["C", "Programming"],
            location: "Library Entrance",
            description: "Basic programming book for beginners.",
            contact: "vikas.shinde20@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(6),
        },
        {
            title: "Backpack (Wildcraft)",
            category: "Daily Use",
            condition: "Good",
            transactionType: "Barter",
            tags: ["Bag"],
            location: "Main Gate",
            description: "Spacious bag, slightly used.",
            contact: "deepak.yadav19@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
            urgent: true,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(7),
        },
        {
            title: "USB Pendrive 32GB",
            category: "Electronics",
            condition: "Good",
            transactionType: "Donate",
            tags: ["Storage"],
            location: "Computer Lab",
            description: "Fully working pendrive.",
            contact: "megha.pawar21@fcrit.ac.in",
            imageUrl: "https://m.media-amazon.com/images/I/61aflcZgumL.jpg",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(8),
        },
        {
            title: "Thermodynamics Book",
            category: "Books",
            condition: "Good",
            transactionType: "Barter",
            tags: ["Thermo"],
            location: "Mechanical Dept",
            description: "Useful reference book.",
            contact: "sachin.kadam20@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(9),
        },
        {
            title: "Desk Table Lamp",
            category: "Daily Use",
            condition: "Excellent",
            transactionType: "Donate",
            tags: ["Lamp"],
            location: "Hostel Study Room",
            description: "Bright LED lamp for study.",
            contact: "pooja.singh22@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(10),
        },
        {
            title: "Keyboard (USB)",
            category: "Electronics",
            condition: "Good",
            transactionType: "Barter",
            tags: ["Keyboard"],
            location: "IT Lab",
            description: "All keys working fine.",
            contact: "arjun.menon21@fcrit.ac.in",
            imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(11),
        },
        {
            title: "Graph Notebook",
            category: "Books",
            condition: "Like New",
            transactionType: "Donate",
            tags: ["Notebook"],
            location: "Station Road",
            description: "Unused graph notebook.",
            contact: "tanvi.desai23@fcrit.ac.in",
            imageUrl: "https://5.imimg.com/data5/FS/IJ/MY-38783455/graph-paper-notebook-1000x1000.jpg",
            urgent: true,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(12),
        },
        {
            title: "Phone Stand",
            category: "Daily Use",
            condition: "Good",
            transactionType: "Barter",
            tags: ["Mobile"],
            location: "Canteen Area",
            description: "Adjustable mobile stand.",
            contact: "kiran.shetty20@fcrit.ac.in",
            imageUrl: "https://static.vecteezy.com/system/resources/previews/027/711/254/large_2x/phone-stand-design-and-line-art-phone-stand-icon-outline-illustration-phone-stand-with-white-background-vector.jpg",
            urgent: false,
            price: 0,
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(14),
        }
    ];

    // Use raw MongoDB insertMany to allow custom createdAt values
    await Item.collection.insertMany(
        dummyData.map(d => ({
            ...d,
            updatedAt: d.createdAt,
            status: 'Available',
        }))
    );
    console.log('Seeded database with demo listings.');
};

// ── DB Connection ──────────────────────────────────────────────
const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGO_URI;
        let connected = false;

        if (mongoUri) {
            try {
                console.log(`Attempting to connect to MongoDB at ${mongoUri}...`);
                await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
                console.log('✅ Connected to Local MongoDB.');
                connected = true;
            } catch (e) {
                console.log(`❌ Failed: ${e.message}. Falling back to in-memory server...`);
            }
        }

        if (!connected) {
            const mongoServer = await MongoMemoryServer.create();
            mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
            console.log(`✅ Connected to MongoDB Memory Server at ${mongoUri}`);
        }

        await seedDatabase();

        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} — Socket.IO active`);
        });
    } catch (err) {
        console.error('Core MongoDB Connection Error:', err);
        process.exit(1);
    }
};

connectDB();
