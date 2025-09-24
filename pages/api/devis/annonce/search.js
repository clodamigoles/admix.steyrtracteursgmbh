import { connectDB } from '@/lib/mongodb'
import { Devis } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    await connectDB()

    try {
        const { q, limit = 10 } = req.query

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'La recherche doit contenir au moins 2 caractères'
            })
        }

        const searchRegex = { $regex: q.trim(), $options: 'i' }

        const devisList = await Devis.find({
            $or: [
                { nom: searchRegex },
                { prenom: searchRegex },
                { email: searchRegex },
                { telephone: searchRegex },
                { ville: searchRegex },
                { annonceTitre: searchRegex }
            ]
        })
            .populate({
                path: 'annonceId',
                select: 'titre marque modele prix devise'
            })
            .select('nom prenom email telephone ville statut createdAt annonceTitre')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))

        return res.status(200).json({
            success: true,
            data: devisList
        })

    } catch (error) {
        console.error('Erreur lors de la recherche de devis:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la recherche'
        })
    }
}