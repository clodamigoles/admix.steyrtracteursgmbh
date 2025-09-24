import { connectDB } from '@/lib/mongodb'
import { Category } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    await connectDB()

    try {
        // Récupérer toutes les catégories
        const categories = await Category.find({})
            .sort({ niveau: 1, nom: 1 })
            .lean()

        // Construire l'arbre hiérarchique
        const tree = buildCategoryTree(categories)

        return res.status(200).json({
            success: true,
            data: tree
        })

    } catch (error) {
        console.error('Erreur lors de la construction de l\'arbre:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        })
    }
}

// Fonction pour construire l'arbre récursivement
function buildCategoryTree(categories, parentId = null) {
    const children = categories
        .filter(cat => {
            if (parentId === null) {
                return cat.parentId === null || cat.parentId === undefined
            }
            return cat.parentId && cat.parentId.toString() === parentId.toString()
        })
        .map(cat => ({
            ...cat,
            children: buildCategoryTree(categories, cat._id)
        }))

    return children
}