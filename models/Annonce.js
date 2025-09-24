import mongoose from 'mongoose'

const annonceSchema = new mongoose.Schema({
    titre: {
        type: String,
        required: true,
        trim: true
    },
    marque: {
        type: String,
        required: true,
        trim: true
    },
    modele: {
        type: String,
        trim: true
    },
    pays: {
        type: String,
        required: true,
        trim: true
    },
    etat: {
        type: String,
        required: true,
        enum: ['neuf', 'occasion', 'reconditionne'],
        default: 'occasion'
    },
    prix: {
        type: Number,
        required: true,
        min: 0
    },
    devise: {
        type: String,
        required: true,
        enum: ['EUR', 'USD', 'GBP', 'CHF'],
        default: 'EUR'
    },
    annee: {
        type: Number,
        required: true,
        min: 1900,
        max: new Date().getFullYear() + 1
    },
    typeCarburant: {
        type: String,
        required: true,
        enum: ['diesel', 'essence', 'electrique', 'hybride', 'autre'],
        default: 'diesel'
    },
    poids: {
        type: Number,
        min: 0 // en kg
    },
    hauteur: {
        type: Number,
        min: 0 // en cm
    },
    longueur: {
        type: Number,
        min: 0 // en cm
    },
    largeur: {
        type: Number,
        min: 0 // en cm
    },
    puissance: {
        type: Number,
        min: 0 // en CV
    },
    kilometrage: {
        type: Number,
        min: 0
    },
    photos: [{
        type: String,
        trim: true
    }],
    caracteristiques: [{
        nom: {
            type: String,
            required: true,
            trim: true
        },
        valeur: {
            type: String,
            required: true,
            trim: true
        },
        unite: {
            type: String,
            trim: true
        }
    }],
    plusInfos: {
        type: String,
        trim: true
    },

    // Relations
    categorieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    vendeurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendeur',
        required: true
    },

    // Stats
    stats: {
        vues: {
            type: Number,
            default: 0
        },
        favoris: {
            type: Number,
            default: 0
        },
        postedAt: {
            type: Date,
            default: Date.now
        }
    },

    // État de l'annonce
    statut: {
        type: String,
        enum: ['active', 'vendue', 'suspendue', 'brouillon'],
        default: 'active'
    }
}, {
    timestamps: true
})

// Index pour optimiser les recherches
annonceSchema.index({ statut: 1, createdAt: -1 })
annonceSchema.index({ categorieId: 1, statut: 1 })
annonceSchema.index({ vendeurId: 1 })
annonceSchema.index({ marque: 1, modele: 1 })
annonceSchema.index({ prix: 1, devise: 1 })
annonceSchema.index({ annee: 1 })
annonceSchema.index({ pays: 1 })
annonceSchema.index({ titre: 'text', marque: 'text', modele: 'text' })

// Méthode pour incrémenter les vues
annonceSchema.methods.incrementVues = function () {
    this.stats.vues += 1
    return this.save()
}

export default mongoose.models.Annonce || mongoose.model('Annonce', annonceSchema)