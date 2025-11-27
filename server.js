require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Ingredient, Plat, Commande } = require('./models/Schemas');

const app = express();

// Configuration pour Vercel et EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views'); // Chemin explicite pour Vercel
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public')); // Chemin explicite pour les fichiers statiques

// Connexion MongoDB (Gère les erreurs de connexion sans crasher l'app)
if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("🟢 Connecté à MongoDB"))
        .catch(err => console.error("🔴 Erreur DB:", err));
}

// --- ROUTES CLIENT ---

app.get('/', async (req, res) => {
    try {
        const plats = await Plat.find();
        res.render('index', { plats, query: req.query });
    } catch (e) {
        res.status(500).send("Erreur chargement menu");
    }
});

app.post('/commander', async (req, res) => {
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

                // Déduction Stock
                if(platDb.ingredientsRequis && platDb.ingredientsRequis.length > 0) {
                    for (let reqIng of platDb.ingredientsRequis) {
                        if(reqIng.ingredient) {
                            const qteADeduire = reqIng.quantite * item.qty;
                            await Ingredient.findByIdAndUpdate(reqIng.ingredient._id, { 
                                $inc: { quantite: -qteADeduire } 
                            });
                        }
                    }
                }
            }
        }

        await Commande.create({ client: clientNom, items: itemsCommande, total: total });
        res.redirect('/?success=true');
    } catch (e) {
        console.error(e);
        res.send("Erreur: " + e.message);
    }
});

// --- ROUTES ADMIN ---

app.get('/admin', async (req, res) => {
    try {
        const ingredients = await Ingredient.find();
        const plats = await Plat.find().populate('ingredientsRequis.ingredient');
        const commandes = await Commande.find().sort({ date: -1 });
        res.render('admin', { ingredients, plats, commandes });
    } catch (e) {
        res.status(500).send("Erreur chargement admin");
    }
});

app.post('/admin/add-stock', async (req, res) => {
    await Ingredient.create(req.body);
    res.redirect('/admin');
});

app.post('/admin/add-plat', async (req, res) => {
    const { nom, prix, image, description, ingredientId, ingredientQte } = req.body;
    let ingredientsRequis = [];
    if(ingredientId && ingredientQte) {
        ingredientsRequis.push({ ingredient: ingredientId, quantite: ingredientQte });
    }
    await Plat.create({ nom, prix, image, description, ingredientsRequis });
    res.redirect('/admin');
});

app.post('/admin/update-status/:id', async (req, res) => {
    await Commande.findByIdAndUpdate(req.params.id, { statut: req.body.statut });
    res.redirect('/admin');
});

// --- MODIFICATION POUR VERCEL ---
// On exporte l'app au lieu d'écouter le port directement en production
// Mais on garde l'écoute pour le développement local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Serveur local: http://localhost:${PORT}`));
}

module.exports = app;
