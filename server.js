require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Ingredient, Plat, Commande } = require('./models/Schemas');

const app = express();

// Configuration Vercel & EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// --- CONNEXION SÉCURISÉE (Anti-Crash) ---
const connectDB = async () => {
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("🟢 Connecté à MongoDB (Opulence)");
        } catch (err) {
            console.error("⚠️ Mode Hors-Ligne : Impossible de se connecter à la DB.");
        }
    }
};
connectDB(); // Tentative de connexion au démarrage

// --- ROUTES CLIENT ---

app.get('/', async (req, res) => {
    let plats = [];
    let dbStatus = false;

    try {
        if (mongoose.connection.readyState === 1) {
            plats = await Plat.find();
            dbStatus = true;
        }
    } catch (e) {
        console.error("Erreur lecture plats:", e.message);
    }

    // Affiche le site même si 'plats' est vide
    res.render('index', { plats, query: req.query, dbStatus });
});

app.post('/commander', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.send("Service momentanément indisponible (Connexion DB).");
    }

    try {
        const { panierJson, clientNom } = req.body;
        const panier = JSON.parse(panierJson);
        
        let total = 0;
        let itemsCommande = [];

        for (let item of panier) {
            const platDb = await Plat.findById(item.id).populate('ingredientsRequis.ingredient');
            if (platDb) {
                total += platDb.prix * item.qty;
                itemsCommande.push({ platNom: platDb.nom, quantite: item.qty, prix: platDb.prix });

                // Gestion des stocks
                if(platDb.ingredientsRequis) {
                    for (let reqIng of platDb.ingredientsRequis) {
                        if(reqIng.ingredient) {
                            await Ingredient.findByIdAndUpdate(reqIng.ingredient._id, { 
                                $inc: { quantite: -(reqIng.quantite * item.qty) } 
                            });
                        }
                    }
                }
            }
        }

        await Commande.create({ client: clientNom, items: itemsCommande, total: total });
        res.redirect('/?success=true');
    } catch (e) {
        res.send("Erreur commande: " + e.message);
    }
});

// --- ROUTES ADMIN ---

app.get('/admin', async (req, res) => {
    let data = { ingredients: [], plats: [], commandes: [] };
    
    try {
        if (mongoose.connection.readyState === 1) {
            data.ingredients = await Ingredient.find();
            data.plats = await Plat.find();
            data.commandes = await Commande.find().sort({ date: -1 });
        }
        res.render('admin', data);
    } catch (e) {
        res.render('admin', data); // Affiche le dashboard vide en cas d'erreur
    }
});

app.post('/admin/add-stock', async (req, res) => {
    try { await Ingredient.create(req.body); } catch(e){}
    res.redirect('/admin');
});

app.post('/admin/add-plat', async (req, res) => {
    try {
        const { nom, prix, image, description, ingredientId, ingredientQte } = req.body;
        let ingredientsRequis = [];
        if(ingredientId && ingredientQte) ingredientsRequis.push({ ingredient: ingredientId, quantite: ingredientQte });
        await Plat.create({ nom, prix, image, description, ingredientsRequis });
    } catch(e){}
    res.redirect('/admin');
});

app.post('/admin/update-status/:id', async (req, res) => {
    try { await Commande.findByIdAndUpdate(req.params.id, { statut: req.body.statut }); } catch(e){}
    res.redirect('/admin');
});

// Serveur Local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`💎 Opulence est en ligne: http://localhost:${PORT}`));
}

module.exports = app;
