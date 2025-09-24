import { connectDB } from '@/lib/mongodb'
import { Annonce, Vendeur, Devis, Category, Recherche } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    await connectDB()

    try {
        // Période pour les comparaisons (30 derniers jours)
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Exécuter toutes les requêtes en parallèle pour optimiser les performances
        const [
            // Stats générales annonces
            totalAnnonces,
            annoncesActives,
            annoncesVendues,
            annoncesSuspendues,
            annoncesBrouillon,
            annoncesCette30j,
            annoncesCette7j,

            // Stats vendeurs
            totalVendeurs,
            vendeursActifs,
            nouveauVendeurs30j,

            // Stats devis
            totalDevis,
            devisNouveau,
            devisEnCours,
            devisEnvoye,
            devisAccepte,
            devisRefuse,
            devisExpire,
            devisCette30j,
            devisCette7j,

            // Stats catégories
            totalCategories,
            categoriesMere,

            // Stats recherches
            recherchesCette30j,
            recherchesCette7j,

            // Valeurs moyennes
            prixMoyenAnnonces,
            vuesMoyennesAnnonces,

            // Top performers
            topCategories,
            topMarques,
            topVendeurs
        ] = await Promise.all([
            // Annonces
            Annonce.countDocuments(),
            Annonce.countDocuments({ statut: 'active' }),
            Annonce.countDocuments({ statut: 'vendue' }),
            Annonce.countDocuments({ statut: 'suspendue' }),
            Annonce.countDocuments({ statut: 'brouillon' }),
            Annonce.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Annonce.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

            // Vendeurs
            Vendeur.countDocuments(),
            Vendeur.countDocuments({ activite: true }),
            Vendeur.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

            // Devis
            Devis.countDocuments(),
            Devis.countDocuments({ statut: 'nouveau' }),
            Devis.countDocuments({ statut: 'en_cours' }),
            Devis.countDocuments({ statut: 'envoye' }),
            Devis.countDocuments({ statut: 'accepte' }),
            Devis.countDocuments({ statut: 'refuse' }),
            Devis.countDocuments({ statut: 'expire' }),
            Devis.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Devis.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

            // Catégories
            Category.countDocuments(),
            Category.countDocuments({ niveau: 1 }),

            // Recherches
            Recherche.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Recherche.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

            // Moyennes
            Annonce.aggregate([
                { $match: { statut: 'active' } },
                { $group: { _id: null, avgPrice: { $avg: '$prix' } } }
            ]),
            Annonce.aggregate([
                { $group: { _id: null, avgViews: { $avg: '$stats.vues' } } }
            ]),

            // Top categories (avec comptage d'annonces)
            Annonce.aggregate([
                { $match: { statut: 'active' } },
                { $group: { _id: '$categorieId', count: { $sum: 1 } } },
                { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
                { $unwind: '$category' },
                { $project: { _id: 1, nom: '$category.nom', count: 1 } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),

            // Top marques
            Annonce.aggregate([
                { $match: { statut: 'active' } },
                { $group: { _id: '$marque', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            // Top vendeurs (par nombre d'annonces actives)
            Annonce.aggregate([
                { $match: { statut: 'active' } },
                { $group: { _id: '$vendeurId', count: { $sum: 1 } } },
                { $lookup: { from: 'vendeurs', localField: '_id', foreignField: '_id', as: 'vendeur' } },
                { $unwind: '$vendeur' },
                { $project: { _id: 1, nom: '$vendeur.nom', count: 1, activite: '$vendeur.activite' } },
                { $match: { activite: true } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ])

        // Calculer les taux de croissance
        const calculateGrowthRate = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0
            return Math.round(((current - previous) / previous) * 100)
        }

        // Calculs de croissance (approximatifs basés sur les périodes)
        const annoncesGrowthRate = calculateGrowthRate(annoncesCette7j, Math.max(1, annoncesCette30j - annoncesCette7j))
        const devisGrowthRate = calculateGrowthRate(devisCette7j, Math.max(1, devisCette30j - devisCette7j))
        const rechercheGrowthRate = calculateGrowthRate(recherchesCette7j, Math.max(1, recherchesCette30j - recherchesCette7j))

        // Structurer la réponse
        const stats = {
            // Vue d'ensemble
            overview: {
                totalAnnonces,
                totalVendeurs,
                totalDevis,
                totalCategories,
                performance: {
                    annoncesCroissance: annoncesGrowthRate,
                    devisCroissance: devisGrowthRate,
                    rechercheCroissance: rechercheGrowthRate,
                    tauxConversionDevis: totalDevis > 0 ? Math.round((devisAccepte / totalDevis) * 100) : 0
                }
            },

            // Détail des annonces
            annonces: {
                total: totalAnnonces,
                parStatut: {
                    active: annoncesActives,
                    vendue: annoncesVendues,
                    suspendue: annoncesSuspendues,
                    brouillon: annoncesBrouillon
                },
                nouvelles30j: annoncesCette30j,
                nouvelles7j: annoncesCette7j,
                prixMoyen: prixMoyenAnnonces.length > 0 ? Math.round(prixMoyenAnnonces[0].avgPrice || 0) : 0,
                vuesMoyennes: vuesMoyennesAnnonces.length > 0 ? Math.round(vuesMoyennesAnnonces[0].avgViews || 0) : 0
            },

            // Détail des vendeurs
            vendeurs: {
                total: totalVendeurs,
                actifs: vendeursActifs,
                inactifs: totalVendeurs - vendeursActifs,
                nouveaux30j: nouveauVendeurs30j,
                tauxActivite: totalVendeurs > 0 ? Math.round((vendeursActifs / totalVendeurs) * 100) : 0
            },

            // Détail des devis
            devis: {
                total: totalDevis,
                parStatut: {
                    nouveau: devisNouveau,
                    en_cours: devisEnCours,
                    envoye: devisEnvoye,
                    accepte: devisAccepte,
                    refuse: devisRefuse,
                    expire: devisExpire
                },
                nouveaux30j: devisCette30j,
                nouveaux7j: devisCette7j,
                tauxAcceptation: totalDevis > 0 ? Math.round((devisAccepte / totalDevis) * 100) : 0,
                tauxRefus: totalDevis > 0 ? Math.round((devisRefuse / totalDevis) * 100) : 0
            },

            // Catégories
            categories: {
                total: totalCategories,
                mere: categoriesMere,
                moyenne_par_mere: categoriesMere > 0 ? Math.round((totalCategories - categoriesMere) / categoriesMere) : 0
            },

            // Activité recherche
            recherches: {
                total30j: recherchesCette30j,
                total7j: recherchesCette7j,
                moyenneJour: Math.round(recherchesCette30j / 30)
            },

            // Top performers
            topPerformers: {
                categories: topCategories.map(cat => ({
                    id: cat._id,
                    nom: cat.nom,
                    annonces: cat.count
                })),
                marques: topMarques.map(marque => ({
                    nom: marque._id,
                    annonces: marque.count
                })),
                vendeurs: topVendeurs.map(vendeur => ({
                    id: vendeur._id,
                    nom: vendeur.nom,
                    annonces: vendeur.count
                }))
            }
        }

        return res.status(200).json({
            success: true,
            data: stats,
            generatedAt: new Date().toISOString()
        })

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des statistiques'
        })
    }
}