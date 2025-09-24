import { connectDB } from '@/lib/mongodb'
import { Devis } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    await connectDB()

    const { id } = req.query
    const { statut, note } = req.body

    try {
        // Validation du statut
        const statutsValides = ['nouveau', 'en_cours', 'envoye', 'accepte', 'refuse', 'expire']
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({
                success: false,
                error: 'Statut invalide'
            })
        }

        const updateData = { statut }
        if (note !== undefined) {
            updateData.note = note.trim()
        }

        // Si le statut passe à "expire", définir la date d'expiration
        if (statut === 'expire') {
            updateData.expireAt = new Date()
        }

        const updatedDevis = await Devis.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate({
                path: 'annonceId',
                select: 'titre marque modele'
            })

        if (!updatedDevis) {
            return res.status(404).json({
                success: false,
                error: 'Devis introuvable'
            })
        }

        // Messages personnalisés selon le statut
        const messages = {
            nouveau: 'Devis marqué comme nouveau',
            en_cours: 'Devis en cours de traitement',
            envoye: 'Devis envoyé au client',
            accepte: 'Devis accepté par le client',
            refuse: 'Devis refusé',
            expire: 'Devis marqué comme expiré'
        }

        return res.status(200).json({
            success: true,
            data: updatedDevis,
            message: messages[statut]
        })

    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        })
    }
}