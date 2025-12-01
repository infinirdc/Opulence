const mongoose = require('mongoose');

// Schéma Ingredient
const ingredientSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom de l\'ingrédient est requis'],
        trim: true,
        unique: true
    },
    unite: {
        type: String,
        required: [true, 'L\'unité de mesure est requise'],
        enum: ['g', 'kg', 'ml', 'L', 'unité', 'pièce'],
        default: 'g'
    },
    stock: {
        type: Number,
        required: [true, 'Le stock initial est requis'],
        min: [0, 'Le stock ne peut pas être négatif'],
        default: 0
    },
    seuilAlerte: {
        type: Number,
        min: [0, 'Le seuil d\'alerte ne peut pas être négatif'],
        default: 10
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Schéma Plat
const platSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom du plat est requis'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'La description est requise'],
        trim: true
    },
    prix: {
        type: Number,
        required: [true, 'Le prix est requis'],
        min: [0, 'Le prix ne peut pas être négatif']
    },
    ingredients: [{
        ingredient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true
        },
        quantite: {
            type: Number,
            required: true,
            min: [0, 'La quantité ne peut pas être négative']
        }
    }],
    disponible: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Schéma Commande
const commandeSchema = new mongoose.Schema({
    nomClient: {
        type: String,
        required: [true, 'Le nom du client est requis'],
        trim: true
    },
    telephone: {
        type: String,
        required: [true, 'Le téléphone est requis'],
        trim: true
    },
    plats: [{
        plat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Plat',
            required: true
        },
        quantite: {
            type: Number,
            required: true,
            min: [1, 'La quantité doit être au moins 1']
        }
    }],
    statut: {
        type: String,
        enum: ['en attente', 'en préparation', 'prête', 'livrée', 'annulée'],
        default: 'en attente'
    },
    date: {
        type: Date,
        default: Date.now
    },
    total: {
        type: Number,
        min: [0, 'Le total ne peut pas être négatif']
    }
});

// Middleware pour mettre à jour updatedAt
ingredientSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

platSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index pour améliorer les performances
ingredientSchema.index({ nom: 1 });
platSchema.index({ nom: 1, disponible: 1 });
commandeSchema.index({ date: -1, statut: 1 });

// Calculer le total avant de sauvegarder une commande
commandeSchema.pre('save', async function(next) {
    if (this.isModified('plats')) {
        let total = 0;
        
        for (const item of this.plats) {
            const plat = await mongoose.model('Plat').findById(item.plat);
            if (plat) {
                total += plat.prix * item.quantite;
            }
        }
        
        this.total = total;
    }
    next();
});

// Création des modèles
const Ingredient = mongoose.model('Ingredient', ingredientSchema);
const Plat = mongoose.model('Plat', platSchema);
const Commande = mongoose.model('Commande', commandeSchema);

module.exports = {
    Ingredient,
    Plat,
    Commande
};