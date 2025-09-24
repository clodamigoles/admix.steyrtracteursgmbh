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
    const { statut } = req.body

    try {
        // Validation du statut
        const statutsValides = ['active', 'vendue', 'suspendue', 'brouillon']
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({
                success: false,
                error: 'Statut invalide'
            })
        }

        const updatedAnnonce = await Annonce.findByIdAndUpdate(
            id,
            { statut },
            { new: true }
        )
            .populate('categorieId', 'nom slug')
            .populate('vendeurId', 'nom')

        if (!updatedAnnonce) {
            return res.status(404).json({
                success: false,
                error: 'Annonce introuvable'
            })
        }

        return res.status(200).json({
            success: true,
            data: updatedAnnonce,
            message: `Statut mis à jour: ${statut}`
        })

    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        })
    }
}