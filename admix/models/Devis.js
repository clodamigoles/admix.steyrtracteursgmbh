import mongoose from 'mongoose'

const devisSchema = new mongoose.Schema({
    // Infos client
    nom: {
        type: String,
        required: true,
        trim: true
    },
    prenom: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    telephone: {
        type: String,
        required: true,
        trim: true
    },

    // Adresse
    numeroRue: {
        type: String,
        required: true,
        trim: true
    },
    rue: {
        type: String,
        required: true,
        trim: true
    },
    codePostal: {
        type: String,
        required: true,
        trim: true
    },
    ville: {
        type: String,
        required: true,
        trim: true
    },
    canton: {
        type: String,
        trim: true
    },
    pays: {
        type: String,
        trim: true,
        default: 'France'
    },

    // Relation avec l'annonce
    annonceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Annonce',
        required: true
    },
    annonceTitre: {
        type: String, // Dénormalisé pour faciliter l'affichage
        trim: true
    },

    // Infos du devis
    message: {
        type: String,
        trim: true
    },
    note: {
        type: String, // Note interne admin
        trim: true
    },
    statut: {
        type: String,
        enum: ['nouveau', 'en_cours', 'envoye', 'accepte', 'refuse', 'expire'],
        default: 'nouveau'
    },

    // Dates
    expireAt: {
        type: Date
    }
}, {
    timestamps: true
})

// Index pour les recherches
devisSchema.index({ statut: 1, createdAt: -1 })
devisSchema.index({ annonceId: 1 })
devisSchema.index({ email: 1 })
devisSchema.index({ createdAt: -1 })

export default mongoose.models.Devis || mongoose.model('Devis', devisSchema)