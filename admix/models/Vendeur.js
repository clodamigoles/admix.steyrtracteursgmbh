import mongoose from 'mongoose'

const vendeurSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        public_id: {
            type: String,
            trim: true
        },
        secure_url: {
            type: String,
            trim: true
        },
        width: Number,
        height: Number,
        format: String,
        size: Number
    },
    couverture: {
        public_id: {
            type: String,
            trim: true
        },
        secure_url: {
            type: String,
            trim: true
        },
        width: Number,
        height: Number,
        format: String,
        size: Number
    },
    avisNote: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    activite: {
        type: Boolean,
        default: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    telephone: {
        type: String,
        trim: true
    },
    adresse: {
        type: String,
        trim: true
    },
    ville: {
        type: String,
        trim: true
    },
    codePostal: {
        type: String,
        trim: true
    },
    pays: {
        type: String,
        trim: true,
        default: 'France'
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
})

// Index pour les recherches
vendeurSchema.index({ nom: 'text', ville: 'text' })
vendeurSchema.index({ activite: 1 })

export default mongoose.models.Vendeur || mongoose.model('Vendeur', vendeurSchema)