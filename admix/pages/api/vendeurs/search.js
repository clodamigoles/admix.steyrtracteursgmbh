import { connectDB } from '@/lib/mongodb'
import { Vendeur } from '@/models'

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

        const vendeurs = await Vendeur.find({
            $and: [
                { activite: true }, // Seulement les vendeurs actifs pour la recherche
                {
                    $or: [
                        { nom: searchRegex },
                        { email: searchRegex },
                        { ville: searchRegex },
                        { telephone: searchRegex }
                    ]
                }
            ]
        })
            .select('nom email telephone ville avisNote logo')
            .limit(parseInt(limit))
            .sort({ nom: 1 })

        return res.status(200).json({
            success: true,
            data: vendeurs
        })

    } catch (error) {
        console.error('Erreur lors de la recherche de vendeurs:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la recherche'
        })
    }
}