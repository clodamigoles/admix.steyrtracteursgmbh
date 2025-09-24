import { connectDB } from '@/lib/mongodb'
import { Annonce } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    await connectDB()

    const { id } = req.query

    try {
        const originalAnnonce = await Annonce.findById(id)

        if (!originalAnnonce) {
            return res.status(404).json({
                success: false,
                error: 'Annonce introuvable'
            })
        }

        // Créer une copie
        const annonceData = originalAnnonce.toObject()
        delete annonceData._id
        delete annonceData.createdAt
        delete annonceData.updatedAt

        // Modifier le titre pour indiquer que c'est une copie
        annonceData.titre = `${annonceData.titre} (Copie)`
        annonceData.statut = 'brouillon'
        annonceData.stats = {
            vues: 0,
            favoris: 0,
            postedAt: new Date()
        }

        const duplicatedAnnonce = new Annonce(annonceData)
        await duplicatedAnnonce.save()

        await duplicatedAnnonce.populate('categorieId', 'nom slug')
        await duplicatedAnnonce.populate('vendeurId', 'nom')

        return res.status(201).json({
            success: true,
            data: duplicatedAnnonce,
            message: 'Annonce dupliquée avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la duplication:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la duplication'
        })
    }
}