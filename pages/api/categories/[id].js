import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'

export default async function handler(req, res) {
    await connectDB()

    const { id } = req.query

    switch (req.method) {
        case 'GET':
            return await getCategoryById(req, res, id)
        case 'PUT':
            return await updateCategory(req, res, id)
        case 'DELETE':
            return await deleteCategory(req, res, id)
        default:
            return res.status(405).json({
                success: false,
                error: 'Méthode non autorisée'
            })
    }
}

// GET /api/categories/[id]
async function getCategoryById(req, res, id) {
    try {
        const category = await Category.findById(id)
            .populate('parentId', 'nom slug niveau')

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Catégorie introuvable'
            })
        }

        return res.status(200).json({
            success: true,
            data: category
        })

    } catch (error) {
        console.error('Erreur lors de la récupération de la catégorie:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        })
    }
}

// PUT /api/categories/[id]
async function updateCategory(req, res, id) {
    try {
        const { nom, slug, description, icon, parentId } = req.body

        console.log('Données reçues pour mise à jour:', {
            id,
            nom,
            slug,
            description,
            icon: typeof icon === 'object' ? 'Objet Cloudinary' : icon,
            parentId
        })

        // Validation des champs requis
        if (!nom || !slug) {
            return res.status(400).json({
                success: false,
                error: 'Le nom et le slug sont requis'
            })
        }

        // Vérifier que la catégorie existe
        const existingCategory = await Category.findById(id)
        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                error: 'Catégorie introuvable'
            })
        }

        // Vérification de l'unicité du slug (sauf pour la catégorie actuelle)
        const duplicateSlug = await Category.findOne({
            slug: slug.toLowerCase().trim(),
            _id: { $ne: id }
        })
        if (duplicateSlug) {
            return res.status(400).json({
                success: false,
                error: 'Ce slug existe déjà'
            })
        }

        // Gestion du changement de parent
        let niveau = existingCategory.niveau
        let validatedParentId = existingCategory.parentId

        if (parentId !== undefined) {
            if (parentId === null || parentId === '') {
                // Devient une catégorie mère
                niveau = 1
                validatedParentId = null
            } else {
                // Vérifier le nouveau parent
                if (parentId === id) {
                    return res.status(400).json({
                        success: false,
                        error: 'Une catégorie ne peut pas être son propre parent'
                    })
                }

                const parentCategory = await Category.findById(parentId)
                if (!parentCategory) {
                    return res.status(400).json({
                        success: false,
                        error: 'Catégorie parent introuvable'
                    })
                }

                if (parentCategory.niveau >= 3) {
                    return res.status(400).json({
                        success: false,
                        error: 'Impossible de créer plus de 3 niveaux'
                    })
                }

                // Vérifier qu'on ne crée pas de cycle
                const isDescendant = await checkIfDescendant(parentId, id)
                if (isDescendant) {
                    return res.status(400).json({
                        success: false,
                        error: 'Impossible de créer une référence circulaire'
                    })
                }

                niveau = parentCategory.niveau + 1
                validatedParentId = parentId
            }
        }

        // Préparer les données de mise à jour
        const updateData = {
            nom: nom.trim(),
            slug: slug.toLowerCase().trim(),
            description: description?.trim(),
            niveau,
            parentId: validatedParentId
        }

        // Gérer l'icône selon son type
        if (icon !== undefined) {
            if (icon === null || icon === '') {
                // Supprimer l'icône
                updateData.icon = undefined
            } else if (typeof icon === 'object' && icon.public_id) {
                // C'est un objet Cloudinary
                updateData.icon = {
                    public_id: icon.public_id,
                    secure_url: icon.secure_url,
                    width: icon.width,
                    height: icon.height,
                    format: icon.format,
                    size: icon.size
                }
            } else if (typeof icon === 'string') {
                // C'est une chaîne (ancien format ou emoji)
                updateData.icon = {
                    secure_url: icon.trim()
                }
            }
        }

        console.log('Données de mise à jour:', updateData)

        // Mise à jour
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('parentId', 'nom slug niveau')

        console.log('Catégorie mise à jour avec succès:', updatedCategory._id)

        return res.status(200).json({
            success: true,
            data: updatedCategory,
            message: 'Catégorie mise à jour avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error)

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Ce slug existe déjà'
            })
        }

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message)
            return res.status(400).json({
                success: false,
                error: 'Erreur de validation: ' + validationErrors.join(', ')
            })
        }

        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la mise à jour'
        })
    }
}

// DELETE /api/categories/[id]
async function deleteCategory(req, res, id) {
    try {
        // Vérifier que la catégorie existe
        const category = await Category.findById(id)
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Catégorie introuvable'
            })
        }

        // Vérifier s'il y a des sous-catégories
        const hasChildren = await Category.countDocuments({ parentId: id })
        if (hasChildren > 0) {
            return res.status(400).json({
                success: false,
                error: 'Impossible de supprimer une catégorie qui contient des sous-catégories'
            })
        }

        // TODO: Vérifier s'il y a des annonces liées
        // const { Annonce } = require('../../../models')
        // const hasAnnonces = await Annonce.countDocuments({ categorieId: id })
        // if (hasAnnonces > 0) {
        //   return res.status(400).json({
        //     success: false,
        //     error: 'Impossible de supprimer une catégorie qui contient des annonces'
        //   })
        // }

        await Category.findByIdAndDelete(id)

        return res.status(200).json({
            success: true,
            message: 'Catégorie supprimée avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression'
        })
    }
}

// Fonction utilitaire pour vérifier les cycles
async function checkIfDescendant(ancestorId, descendantId) {
    const category = await Category.findById(ancestorId)
    if (!category || !category.parentId) {
        return false
    }

    if (category.parentId.toString() === descendantId) {
        return true
    }

    return await checkIfDescendant(category.parentId, descendantId)
}