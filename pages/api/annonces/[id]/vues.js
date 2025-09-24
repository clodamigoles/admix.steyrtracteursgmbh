import { connectDB } from '@/lib/mongodb'
import { Annonce } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    await connectDB()

    const { id } = req.query

    try {
        const annonce = await Annonce.findById(id)

        if (!annonce) {
            return res.status(404).json({
                success: false,
                error: 'Annonce introuvable'
            })
        }

        // Incrémenter les vues
        await annonce.incrementVues()

        return res.status(200).json({
            success: true,
            data: { vues: annonce.stats.vues },
            message: 'Vues incrémentées'
        })

    } catch (error) {
        console.error('Erreur lors de l\'incrémentation des vues:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        })
    }
}