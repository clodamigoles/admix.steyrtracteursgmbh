import mongoose from "mongoose"

const orderSchema = new mongoose.Schema(
    {
        // Infos client (reprises du DevisForm)
        nom: {
            type: String,
            required: true,
            trim: true,
        },
        prenom: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        telephone: {
            type: String,
            required: true,
            trim: true,
        },

        // Adresse
        numeroRue: {
            type: String,
            required: true,
            trim: true,
        },
        rue: {
            type: String,
            required: true,
            trim: true,
        },
        codePostal: {
            type: String,
            required: true,
            trim: true,
        },
        ville: {
            type: String,
            required: true,
            trim: true,
        },
        canton: {
            type: String,
            trim: true,
        },
        pays: {
            type: String,
            trim: true,
            default: "Autriche",
        },

        // Relation avec l'annonce
        annonceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Annonce",
            required: true,
        },
        annonceTitre: {
            type: String,
            trim: true,
        },
        annoncePrice: {
            type: Number,
            required: true,
        },
        annonceDevise: {
            type: String,
            default: "EUR",
        },

        // Message optionnel
        message: {
            type: String,
            trim: true,
        },

        // Statut de la commande
        statut: {
            type: String,
            enum: ["en_attente", "en_cours", "termine", "annule"],
            default: "en_attente",
        },

        // Informations bancaires (affichées quand statut = en_attente)
        infoBancaires: {
            iban: {
                type: String,
                default: "AT12 3456 7890 1234 5678",
                trim: true,
            },
            bic: {
                type: String,
                default: "BKAUATWW",
                trim: true,
            },
            montant: {
                type: Number,
                required: true,
            },
            devise: {
                type: String,
                default: "EUR",
            },
        },

        // Documents uploadés par le client
        documentsClient: {
            bordereauPaiement: {
                public_id: String,
                secure_url: String,
                original_filename: String,
                size: Number,
                format: String,
                uploaded_at: Date,
            },
        },

        // Dates importantes
        dateCommande: {
            type: Date,
            default: Date.now,
        },
        datePassageEnCours: {
            type: Date,
        },
        dateTerminee: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
)

// Index pour les recherches
orderSchema.index({ statut: 1, createdAt: -1 })
orderSchema.index({ annonceId: 1 })
orderSchema.index({ email: 1 })
orderSchema.index({ createdAt: -1 })

export default mongoose.models.Order || mongoose.model("Order", orderSchema)