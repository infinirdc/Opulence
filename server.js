require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Ingredient, Plat, Commande } = require('./models/Schemas');

const app = express();

// Configuration pour Vercel et EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// --- CONNEXION MONGODB ROBUSTE ---
// On ne bloque pas le démarrage du serveur si la DB échoue
const connectDB = async () => {
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("🟢 Connecté à MongoDB");
        } catch (err) {
            console.error("🔴 Erreur connexion MongoDB (Mode Hors Ligne activé):", err.message);
        }
    }
};
// On tente la connexion au démarrage
connectDB();

// --- ROUTES CLIENT ---

app.get('/', async (req, res) => {
    let plats = [];
    let dbStatus = false;

    try {
        // Vérifie si la DB est connectée avant de chercher les plats
        if (mongoose.connection.readyState === 1) {
            plats = await Plat.find();
            dbStatus = true;
        } else {
            console.log("⚠️ DB non connectée: Chargement de l'index sans plats.");
        }
    } catch (e) {
        console.error("⚠️ Erreur lors de la récupération des plats :", e.message);
        // On ignore l'erreur pour laisser la page s'afficher
    }

    // On rend la vue MÊME si plats est vide ou s'il y a eu une erreur
    res.render('index', { plats, query: req.query, dbStatus });
});

app.post('/commander', async (req, res) => {
    // Si la DB n'est pas là, on ne peut pas commander
    if (mongoose.connection.readyState !== 1) {
        return res.send("Désolé, le service de commande est temporairement indisponible (Erreur connexion).");
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
        res.send("Erreur lors de la commande: " + e.message);
    }
});

// --- ROUTES ADMIN ---

app.get('/admin', async (req, res) => {
    // Initialisation avec des tableaux vides pour éviter le crash EJS
    let ingredients = [];
    let plats = [];
    let commandes = [];

    try {
        if (mongoose.connection.readyState === 1) {
            ingredients = await Ingredient.find();
            plats = await Plat.find().populate('ingredientsRequis.ingredient');
            commandes = await Commande.find().sort({ date: -1 });
        }
        res.render('admin', { ingredients, plats, commandes });
    } catch (e) {
        // En cas d'erreur critique, on affiche quand même le dashboard (vide)
        console.error("Erreur Admin:", e);
        res.render('admin', { ingredients: [], plats: [], commandes: [] });
    }
});

app.post('/admin/add-stock', async (req, res) => {
    try {
        await Ingredient.create(req.body);
    } catch(e) { console.error(e); }
    res.redirect('/admin');
});

app.post('/admin/add-plat', async (req, res) => {
    try {
        const { nom, prix, image, description, ingredientId, ingredientQte } = req.body;
        let ingredientsRequis = [];
        if(ingredientId && ingredientQte) {
            ingredientsRequis.push({ ingredient: ingredientId, quantite: ingredientQte });
        }
        await Plat.create({ nom, prix, image, description, ingredientsRequis });
    } catch(e) { console.error(e); }
    res.redirect('/admin');
});

app.post('/admin/update-status/:id', async (req, res) => {
    try {
        await Commande.findByIdAndUpdate(req.params.id, { statut: req.body.statut });
    } catch(e) { console.error(e); }
    res.redirect('/admin');
});

// --- MODIFICATION POUR VERCEL ---
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Serveur local: http://localhost:${PORT}`));
}

module.exports = app;
