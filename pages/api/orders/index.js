import { Order, AppInfos } from "@/models"
import dbConnect from "@/lib/mongodb"

export default async function handler(req, res) {
    const { method } = req

    await dbConnect()

    switch (method) {
        case "POST":
            try {
                const {
                    nom,
                    prenom,
                    email,
                    telephone,
                    numeroRue,
                    rue,
                    codePostal,
                    ville,
                    canton,
                    pays,
                    annonceId,
                    annonceTitre,
                    annoncePrice,
                    annonceDevise,
                    message,
                } = req.body

                // Validation des champs requis
                if (!nom || !prenom || !email || !telephone || !rue || !codePostal || !ville || !annonceId || !annoncePrice) {
                    return res.status(400).json({
                        success: false,
                        message: "Tous les champs requis doivent être renseignés",
                    })
                }

                // 🔥 RÉCUPÉRER LES INFOS BANCAIRES DEPUIS LA DB
                let iban = 'AT12 3456 7890 1234 5678' // Valeur par défaut
                let bic = 'BKAUATWW' // Valeur par défaut

                try {
                    const dbIban = await AppInfos.getValue('IBAN')
                    const dbBic = await AppInfos.getValue('BIC')
                    
                    if (dbIban) iban = dbIban
                    if (dbBic) bic = dbBic
                    
                    console.log('✅ Infos bancaires récupérées depuis DB:', { iban, bic })
                } catch (dbError) {
                    console.warn('⚠️ Erreur récupération infos bancaires, utilisation valeurs par défaut:', dbError)
                }

                // Créer la commande avec les infos bancaires de la DB
                const order = await Order.create({
                    nom,
                    prenom,
                    email,
                    telephone,
                    numeroRue: numeroRue || "_",
                    rue,
                    codePostal,
                    ville,
                    canton,
                    pays: pays || "Autriche",
                    annonceId,
                    annonceTitre,
                    annoncePrice,
                    annonceDevise: annonceDevise || "EUR",
                    message,
                    statut: "en_attente",
                    infoBancaires: {
                        iban: iban, // 🔥 IBAN depuis DB
                        bic: bic,   // 🔥 BIC depuis DB
                        montant: annoncePrice,
                        devise: annonceDevise || "EUR",
                    },
                })

                // Envoyer les emails de confirmation (ne pas attendre pour ne pas bloquer)
                try {
                    const orderWithData = await Order.findById(order._id).populate({
                        path: "annonceId",
                        select: "titre marque modele prix devise photos vendeurId",
                        populate: {
                            path: "vendeurId",
                            select: "nom email telephone ville",
                        },
                    })
                    
                    // Import des fonctions d'email
                    const { envoyerEmailConfirmationClient, envoyerEmailNotificationAdmin } = require('@/utils/orderEmails')
                    
                    await envoyerEmailConfirmationClient(orderWithData)
                    await envoyerEmailNotificationAdmin(orderWithData)
                    
                    console.log('✅ Emails de confirmation envoyés')
                } catch (emailError) {
                    console.error('⚠️ Erreur envoi emails (commande créée quand même):', emailError)
                }

                res.status(201).json({
                    success: true,
                    message: "Commande créée avec succès",
                    data: order,
                })
            } catch (error) {
                console.error("❌ Erreur création commande:", error)
                res.status(400).json({
                    success: false,
                    message: "Erreur lors de la création de la commande",
                    error: error.message,
                })
            }
            break

        case "GET":
            try {
                const { page = 1, limit = 20, statut, annonceId } = req.query

                const filter = {}

                if (statut) filter.statut = statut
                if (annonceId) filter.annonceId = annonceId

                const pageNum = Number.parseInt(page)
                const limitNum = Number.parseInt(limit)
                const skip = (pageNum - 1) * limitNum

                const orders = await Order.find(filter)
                    .populate("annonceId", "titre prix devise")
                    .sort({ createdAt: -1 })
                    .limit(limitNum)
                    .skip(skip)

                const total = await Order.countDocuments(filter)

                res.status(200).json({
                    success: true,
                    data: orders,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                })
            } catch (error) {
                console.error("❌ Erreur récupération commandes:", error)
                res.status(400).json({
                    success: false,
                    message: "Erreur lors de la récupération des commandes",
                    error: error.message,
                })
            }
            break

        default:
            res.status(400).json({
                success: false,
                message: "Méthode non autorisée",
            })
            break
    }
}