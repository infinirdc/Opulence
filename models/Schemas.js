const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    nom: String,
    quantite: Number,
    unite: String, 
    seuilAlerte: { type: Number, default: 5 }
});

const PlatSchema = new mongoose.Schema({
    nom: String,
    description: String,
    prix: Number,
    image: String,
    ingredientsRequis: [{
        ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
        quantite: Number
    }]
});

const CommandeSchema = new mongoose.Schema({
    client: String,
    items: [{
        platNom: String,
        quantite: Number,
        prix: Number
    }],
    total: Number,
    statut: { type: String, default: 'Nouvelle' }, // Nouvelle, En Cuisine, Terminée
    date: { type: Date, default: Date.now }
});

module.exports = {
    Ingredient: mongoose.model('Ingredient', IngredientSchema),
    Plat: mongoose.model('Plat', PlatSchema),
    Commande: mongoose.model('Commande', CommandeSchema)
};
