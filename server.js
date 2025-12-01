require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

// Import des modèles
const { Ingredient, Plat, Commande } = require('./models/Schemas');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la session
app.use(session({
    secret: process.env.SESSION_SECRET || 'opulence-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 24 heures
    }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connexion MongoDB avec gestion des cold starts
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            console.log('✅ Connecté à MongoDB');
        }
    } catch (err) {
        console.error('❌ Erreur de connexion MongoDB:', err.message);
        // Ne pas crasher l'app en production
        if (process.env.NODE_ENV === 'production') {
            console.log('L\'application continue sans base de données');
        }
    }
};

// Middleware d'authentification admin
const requireAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// Routes publiques
app.get('/', async (req, res) => {
    try {
        await connectDB();
        const plats = await Plat.find({ disponible: true })
            .populate('ingredients.ingredient')
            .lean();
        
        res.render('index', { 
            plats,
            cartItems: req.session.cart || []
        });
    } catch (err) {
        console.error(err);
        res.render('index', { 
            plats: [],
            cartItems: [],
            error: 'Impossible de charger le menu'
        });
    }
});

// Ajouter au panier (session)
app.post('/cart/add', (req, res) => {
    const { platId, quantite } = req.body;
    
    if (!req.session.cart) {
        req.session.cart = [];
    }
    
    const existingItem = req.session.cart.find(item => item.platId === platId);
    
    if (existingItem) {
        existingItem.quantite += parseInt(quantite);
    } else {
        req.session.cart.push({
            platId,
            quantite: parseInt(quantite),
            addedAt: new Date()
        });
    }
    
    res.json({ success: true, cart: req.session.cart });
});

// Supprimer du panier
app.post('/cart/remove', (req, res) => {
    const { platId } = req.body;
    
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.platId !== platId);
    }
    
    res.json({ success: true, cart: req.session.cart });
});

// Passer commande
app.post('/commander', async (req, res) => {
    try {
        await connectDB();
        
        const { nomClient, telephone, plats } = req.body;
        
        if (!nomClient || !telephone || !plats || plats.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Informations incomplètes' 
            });
        }
        
        // Vérifier la disponibilité des ingrédients et déduire les stocks
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            // Pour chaque plat commandé
            for (const item of plats) {
                const plat = await Plat.findById(item.platId)
                    .populate('ingredients.ingredient')
                    .session(session);
                
                if (!plat) {
                    throw new Error(`Plat ${item.platId} non trouvé`);
                }
                
                // Pour chaque ingrédient du plat
                for (const ing of plat.ingredients) {
                    const quantiteNecessaire = ing.quantite * item.quantite;
                    
                    // Décrémentation atomique avec $inc
                    const result = await Ingredient.findByIdAndUpdate(
                        ing.ingredient._id,
                        { 
                            $inc: { stock: -quantiteNecessaire },
                            $min: { stock: 0 } // Empêcher les stocks négatifs
                        },
                        { 
                            session,
                            new: true 
                        }
                    );
                    
                    if (result.stock < 0) {
                        throw new Error(`Stock insuffisant pour ${ing.ingredient.nom}`);
                    }
                }
            }
            
            // Créer la commande
            const commande = new Commande({
                nomClient,
                telephone,
                plats: plats.map(p => ({
                    plat: p.platId,
                    quantite: p.quantite
                })),
                statut: 'en attente',
                date: new Date()
            });
            
            await commande.save({ session });
            
            await session.commitTransaction();
            session.endSession();
            
            // Vider le panier
            req.session.cart = [];
            
            res.json({ 
                success: true, 
                message: 'Commande passée avec succès',
                commandeId: commande._id
            });
            
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
        
    } catch (err) {
        console.error('Erreur commande:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Erreur lors de la commande' 
        });
    }
});

// Routes admin
app.get('/admin/login', (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin');
    }
    res.render('admin-login', { error: null });
});

app.post('/admin/login', (req, res) => {
    const { pin } = req.body;
    
    if (pin === process.env.ADMIN_PIN) {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.render('admin-login', { 
            error: 'PIN incorrect' 
        });
    }
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Dashboard admin (protégé)
app.get('/admin', requireAdmin, async (req, res) => {
    try {
        await connectDB();
        
        const [ingredients, plats, commandes] = await Promise.all([
            Ingredient.find().lean(),
            Plat.find().populate('ingredients.ingredient').lean(),
            Commande.find()
                .populate('plats.plat')
                .sort({ date: -1 })
                .limit(50)
                .lean()
        ]);
        
        res.render('admin', {
            ingredients,
            plats,
            commandes
        });
        
    } catch (err) {
        console.error(err);
        res.render('admin', {
            ingredients: [],
            plats: [],
            commandes: [],
            error: 'Erreur de chargement'
        });
    }
});

// API admin - Gestion des ingrédients
app.post('/admin/ingredients', requireAdmin, async (req, res) => {
    try {
        await connectDB();
        
        const { nom, unite, stock, seuilAlerte } = req.body;
        
        const ingredient = new Ingredient({
            nom,
            unite,
            stock: parseFloat(stock),
            seuilAlerte: parseFloat(seuilAlerte) || 0
        });
        
        await ingredient.save();
        
        res.json({ success: true, ingredient });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/admin/ingredients/:id', requireAdmin, async (req, res) => {
    try {
        await connectDB();
        
        const { stock } = req.body;
        
        const ingredient = await Ingredient.findByIdAndUpdate(
            req.params.id,
            { stock: parseFloat(stock) },
            { new: true }
        );
        
        res.json({ success: true, ingredient });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// API admin - Gestion des plats
app.post('/admin/plats', requireAdmin, async (req, res) => {
    try {
        await connectDB();
        
        const { nom, description, prix, ingredients, disponible } = req.body;
        
        const plat = new Plat({
            nom,
            description,
            prix: parseFloat(prix),
            ingredients: JSON.parse(ingredients),
            disponible: disponible === 'true'
        });
        
        await plat.save();
        
        res.json({ success: true, plat });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/admin/plats/:id', requireAdmin, async (req, res) => {
    try {
        await connectDB();
        
        const { disponible } = req.body;
        
        const plat = await Plat.findByIdAndUpdate(
            req.params.id,
            { disponible: disponible === 'true' },
            { new: true }
        ).populate('ingredients.ingredient');
        
        res.json({ success: true, plat });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// API admin - Mettre à jour le statut d'une commande
app.put('/admin/commandes/:id', requireAdmin, async (req, res) => {
    try {
        await connectDB();
        
        const { statut } = req.body;
        
        const commande = await Commande.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true }
        ).populate('plats.plat');
        
        res.json({ success: true, commande });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Middleware pour les erreurs 404
app.use((req, res) => {
    res.status(404).render('404', { message: 'Page non trouvée' });
});

// Middleware pour les erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        message: 'Une erreur est survenue' 
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur Opulence démarré sur http://localhost:${PORT}`);
});

module.exports = app;