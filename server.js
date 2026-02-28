import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key_only_for_local';

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit body size

// --- SECURITY MIDDLEWARE ---
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
    message: { error: 'Too many login attempts from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- AUTH MIDDLEWARE ---
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized. This incident will be reported.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// --- AUTH ROUTE ---
app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Mint token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, username: user.username, displayName: user.displayName });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- PUBLIC ROUTES (No Auth) ---

app.get('/api/public/weeks', async (req, res) => {
    try {
        const weeks = await prisma.week.findMany({ orderBy: { number: 'asc' } });
        res.json(weeks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch weeks' });
    }
});

// 1) Public Home: list of PUBLISHED posts
app.get('/api/public/posts', async (req, res) => {
    try {
        const { week, tag, q, page = 1, limit = 10 } = req.query;
        const where = { status: 'PUBLISHED' };

        if (week && week !== 'All Weeks' && week !== 'All') {
            const weekMatch = week.match(/\d+/);
            if (weekMatch) where.weekNumber = parseInt(weekMatch[0], 10);
        }

        if (tag && tag !== 'All') {
            where.tags = { has: tag }; // Prisma array filtering
        }

        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { excerpt: { contains: q, mode: 'insensitive' } }
            ];
        }

        const posts = await prisma.note.findMany({
            where,
            select: { id: true, title: true, slug: true, excerpt: true, weekNumber: true, tags: true, publishedAt: true, user: { select: { username: true } } },
            orderBy: { publishedAt: 'desc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// 2) Post detail
app.get('/api/public/posts/:slug', async (req, res) => {
    try {
        const post = await prisma.note.findFirst({
            where: { slug: req.params.slug, status: 'PUBLISHED' },
            include: { user: { select: { username: true } } }
        });
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch post details' });
    }
});

// 3) Author profile
app.get('/api/public/@:username', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { username: req.params.username },
            select: {
                username: true, displayName: true, bio: true,
                notes: {
                    where: { status: 'PUBLISHED' },
                    select: { id: true, title: true, slug: true, excerpt: true, weekNumber: true, tags: true, publishedAt: true },
                    orderBy: { publishedAt: 'desc' }
                }
            }
        });
        if (!user) return res.status(404).json({ error: 'Author not found' });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch author profile' });
    }
});


// --- ADMIN CMS ROUTES (Auth Required) ---

// Upsert Week Details
app.put('/api/weeks/:number', requireAuth, async (req, res) => {
    try {
        const { name } = req.body;
        const number = parseInt(req.params.number);
        const week = await prisma.week.upsert({
            where: { number },
            update: { name },
            create: { number, name }
        });
        res.json(week);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update week' });
    }
});

// Get all notes (drafts and published) for the dashboard
app.get('/api/notes', requireAuth, async (req, res) => {
    try {
        const notes = await prisma.note.findMany({
            where: { userId: req.user.id },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Create note
app.post('/api/notes', requireAuth, async (req, res) => {
    try {
        const { title, content, weekNumber, tags, status } = req.body;
        // Basic slug generation (replace spaces with dashes, lowercase)
        const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`; // append random bit to ensure uniqueness

        const note = await prisma.note.create({
            data: {
                userId: req.user.id,
                title,
                content,
                slug,
                excerpt: content.substring(0, 50) + '...',
                weekNumber: parseInt(weekNumber) || 1,
                tags: tags || [],
                status: status || 'DRAFT',
                ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {})
            }
        });
        res.json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Update note
app.put('/api/notes/:id', requireAuth, async (req, res) => {
    try {
        const { title, content, weekNumber, tags, status } = req.body;

        let updateData = { title, content, weekNumber: parseInt(weekNumber), tags, status, excerpt: content?.substring(0, 50) + '...' };

        if (status === 'PUBLISHED') {
            // Check if it already has a publishedAt, if not, set it
            const existing = await prisma.note.findUnique({ where: { id: req.params.id } });
            if (existing && !existing.publishedAt) {
                updateData.publishedAt = new Date();
            }
        }

        const note = await prisma.note.update({
            where: { id: req.params.id, userId: req.user.id }, // ensure they own it
            data: updateData
        });
        res.json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Delete note
app.delete('/api/notes/:id', requireAuth, async (req, res) => {
    try {
        await prisma.note.delete({
            where: { id: req.params.id, userId: req.user.id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete note' });
    }
});


// Start Server
app.listen(PORT, () => {
    console.log(`CloudEnthu backend running with live DB on port ${PORT}`);
});
