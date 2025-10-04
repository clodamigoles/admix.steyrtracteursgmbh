import mongoose from "mongoose"

const devisSchema = new mongoose.Schema(
    {
        // Infos client
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
            default: "France",
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

        // Infos du devis
        message: {
            type: String,
            trim: true,
        },
        note: {
            type: String, // Note interne admin
            trim: true,
        },
        statut: {
            type: String,
            enum: ["nouveau", "en_cours", "envoye", "accepte", "refuse", "expire", "traitement", "termine"],
            default: "nouveau",
        },

        // Réponse admin
        reponseAdmin: {
            contrat: {
                public_id: String,
                secure_url: String,
                original_filename: String,
                size: Number,
                format: String
            },
            iban: {
                type: String,
                trim: true,
            },
            bic: {
                type: String,
                trim: true,
            },
            montantAPayer: {
                type: Number,
                min: 0,
            },
            devise: {
                type: String,
                default: "EUR",
                trim: true,
            },
            dateReponse: {
                type: Date,
            },
            emailEnvoye: {
                type: Boolean,
                default: false,
            },
            dateEmailEnvoye: {
                type: Date,
            },
            noteAdmin: {
                type: String,
                trim: true,
            }
        },

        // Réponse client
        reponseClient: {
            documentsUploades: {
                contratSigne: {
                    public_id: String,
                    secure_url: String,
                    original_filename: String,
                    size: Number,
                    format: String,
                    uploaded_at: Date
                },
                recuVirement: {
                    public_id: String,
                    secure_url: String,
                    original_filename: String,
                    size: Number,
                    format: String,
                    uploaded_at: Date
                }
            },
            dateUpload: {
                type: Date,
            },
            commentaireClient: {
                type: String,
                trim: true,
            },
            dateAcceptation: {
                type: Date,
            }
        },

        // Suivi de la commande
        suiviCommande: {
            etapes: [{
                nom: {
                    type: String,
                    required: true,
                    trim: true
                },
                description: {
                    type: String,
                    trim: true
                },
                statut: {
                    type: String,
                    enum: ['en_attente', 'en_cours', 'termine'],
                    default: 'en_attente'
                },
                dateDebut: Date,
                dateFin: Date,
                ordre: {
                    type: Number,
                    required: true
                }
            }],
            progression: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },
            dateEstimeeLivraison: Date,
            commentairesAdmin: [{
                message: String,
                date: {
                    type: Date,
                    default: Date.now
                }
            }]
        },

        // Dates - SUPPRESSION de expireAt car rien ne doit expirer
        // expireAt: {
        //     type: Date,
        // },
    },
    {
        timestamps: true,
    },
)

// Index pour les recherches
devisSchema.index({ statut: 1, createdAt: -1 })
devisSchema.index({ annonceId: 1 })
devisSchema.index({ email: 1 })
devisSchema.index({ createdAt: -1 })
devisSchema.index({ 'reponseAdmin.dateReponse': 1 })

export default mongoose.models.Devis || mongoose.model("Devis", devisSchema)