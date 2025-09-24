import { connectDB } from '@/lib/mongodb'
import Vendeur from '@/models/Vendeur'

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
        const vendeur = await Vendeur.findById(id)

        if (!vendeur) {
            return res.status(404).json({
                success: false,
                error: 'Vendeur introuvable'
            })
        }

        // Basculer l'activité
        const updatedVendeur = await Vendeur.findByIdAndUpdate(
            id,
            { activite: !vendeur.activite },
            { new: true }
        )

        return res.status(200).json({
            success: true,
            data: updatedVendeur,
            message: `Vendeur ${updatedVendeur.activite ? 'activé' : 'désactivé'} avec succès`
        })

    } catch (error) {
        console.error('Erreur lors du basculement d\'activité:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        })
    }
}