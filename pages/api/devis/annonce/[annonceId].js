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

    const { annonceId } = req.query
    const { page = 1, limit = 10, statut } = req.query

    try {
        const filter = { annonceId }
        if (statut) {
            filter.statut = statut
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)

        const [devisList, total] = await Promise.all([
            Devis.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-note') // Exclure les notes internes
                .lean(),
            Devis.countDocuments(filter)
        ])

        const totalPages = Math.ceil(total / parseInt(limit))

        return res.status(200).json({
            success: true,
            data: devisList,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext: parseInt(page) < totalPages,
                hasPrevious: parseInt(page) > 1
            }
        })

    } catch (error) {
        console.error('Erreur lors de la récupération des devis par annonce:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        })
    }
}