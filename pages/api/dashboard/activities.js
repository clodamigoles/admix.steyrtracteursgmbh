import { connectDB } from '@/lib/mongodb'
import { Annonce, Devis, Vendeur } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    await connectDB()

    try {
        const { limit = 20 } = req.query

        // Récupérer les activités récentes de différentes collections
        const [annonces, devis, vendeurs] = await Promise.all([
            Annonce.find()
                .populate('vendeurId', 'nom')
                .populate('categorieId', 'nom')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit) / 3)
                .select('titre marque statut createdAt updatedAt vendeurId categorieId')
                .lean(),

            Devis.find()
                .populate({
                    path: 'annonceId',
                    select: 'titre marque',
                    populate: {
                        path: 'vendeurId',
                        select: 'nom'
                    }
                })
                .sort({ createdAt: -1 })
                .limit(parseInt(limit) / 3)
                .select('nom prenom statut createdAt annonceId')
                .lean(),

            Vendeur.find()
                .sort({ createdAt: -1 })
                .limit(parseInt(limit) / 3)
                .select('nom activite createdAt')
                .lean()
        ])

        // Formater les activités avec un type et un message
        const activities = []

        // Annonces
        annonces.forEach(annonce => {
            activities.push({
                id: `annonce-${annonce._id}`,
                type: 'annonce',
                action: 'créée',
                titre: `${annonce.marque} - ${annonce.titre}`,
                details: `Catégorie: ${annonce.categorieId?.nom || 'Non définie'}`,
                vendeur: annonce.vendeurId?.nom,
                statut: annonce.statut,
                date: annonce.createdAt,
                icon: 'car'
            })
        })

        // Devis
        devis.forEach(devis => {
            activities.push({
                id: `devis-${devis._id}`,
                type: 'devis',
                action: 'reçu',
                titre: `Devis de ${devis.prenom} ${devis.nom}`,
                details: devis.annonceId ? `Pour: ${devis.annonceId.marque} - ${devis.annonceId.titre}` : 'Annonce supprimée',
                vendeur: devis.annonceId?.vendeurId?.nom,
                statut: devis.statut,
                date: devis.createdAt,
                icon: 'document'
            })
        })

        // Vendeurs
        vendeurs.forEach(vendeur => {
            activities.push({
                id: `vendeur-${vendeur._id}`,
                type: 'vendeur',
                action: 'inscrit',
                titre: `Nouveau vendeur: ${vendeur.nom}`,
                details: vendeur.activite ? 'Compte activé' : 'En attente d\'activation',
                vendeur: vendeur.nom,
                statut: vendeur.activite ? 'actif' : 'inactif',
                date: vendeur.createdAt,
                icon: 'user'
            })
        })

        // Trier toutes les activités par date
        activities.sort((a, b) => new Date(b.date) - new Date(a.date))

        // Limiter au nombre demandé
        const limitedActivities = activities.slice(0, parseInt(limit))

        return res.status(200).json({
            success: true,
            data: limitedActivities,
            total: activities.length
        })

    } catch (error) {
        console.error('Erreur lors de la récupération des activités:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des activités'
        })
    }
}