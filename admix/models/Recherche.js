import mongoose from 'mongoose'

const rechercheSchema = new mongoose.Schema({
    // Critères de recherche
    categorieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    sousCategorieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    sousSousCategorieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    marque: {
        type: String,
        trim: true
    },
    modele: {
        type: String,
        trim: true
    },
    prixMin: {
        type: Number,
        min: 0
    },
    prixMax: {
        type: Number,
        min: 0
    },

    // Infos vendeur recherchées
    vendeurNote: {
        type: Number,
        min: 0,
        max: 5
    },
    vendeurNom: {
        type: String,
        trim: true
    },
    vendeurTelephone: {
        type: String,
        trim: true
    },
    vendeurEmail: {
        type: String,
        trim: true,
        lowercase: true
    },

    // Métadonnées
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    resultatsCount: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
})

// Index pour les stats
rechercheSchema.index({ createdAt: -1 })
rechercheSchema.index({ categorieId: 1 })
rechercheSchema.index({ marque: 1 })

export default mongoose.models.Recherche || mongoose.model('Recherche', rechercheSchema)