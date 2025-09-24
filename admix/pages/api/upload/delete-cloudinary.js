import { deleteImage } from '@/lib/cloudinary'

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    try {
        const { publicId } = req.body

        if (!publicId) {
            return res.status(400).json({
                success: false,
                error: 'Public ID requis'
            })
        }

        const result = await deleteImage(publicId)

        return res.status(200).json({
            success: true,
            data: result,
            message: 'Image supprimée avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression'
        })
    }
}