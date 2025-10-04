import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'

export default async function handler(req, res) {
    await connectDB()

    switch (req.method) {
        case 'GET':
            return await getCategories(req, res)
        case 'POST':
            return await createCategory(req, res)
        default:
            return res.status(405).json({
                success: false,
                error: 'Méthode non autorisée'
            })
    }
}

// GET /api/categories
async function getCategories(req, res) {
    try {
        const {
            niveau,
            parentId,
            page = 1,
            limit = 250,
            search,
            sortBy = 'nom',
            sortOrder = 'asc'
        } = req.query

        // Construction du filtre
        const filter = {}

        if (niveau) {
            // Gérer plusieurs niveaux séparés par des virgules
            if (niveau.includes(',')) {
                const niveaux = niveau.split(',').map(n => parseInt(n.trim()))
                filter.niveau = { $in: niveaux }
            } else {
                filter.niveau = parseInt(niveau)
            }
        }

        if (parentId) {
            filter.parentId = parentId === 'null' ? null : parentId
        }

        if (search) {
            filter.$or = [
                { nom: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }

        // Options de tri
        const sortOptions = {}
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // Exécution de la requête avec population du parent
        const [categories, total] = await Promise.all([
            Category.find(filter)
                .populate('parentId', 'nom slug niveau')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Category.countDocuments(filter)
        ])

        // Calcul de pagination
        const totalPages = Math.ceil(total / parseInt(limit))
        const hasNext = parseInt(page) < totalPages
        const hasPrevious = parseInt(page) > 1

        return res.status(200).json({
            success: true,
            data: categories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext,
                hasPrevious
            }
        })

    } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des catégories'
        })
    }
}

// POST /api/categories
async function createCategory(req, res) {
    try {
        const { nom, slug, description, icon, parentId } = req.body

        console.log('Données reçues pour création:', {
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

        // Vérification de l'unicité du slug
        const existingCategory = await Category.findOne({ slug: slug.toLowerCase().trim() })
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: 'Ce slug existe déjà'
            })
        }

        // Déterminer le niveau selon le parent
        let niveau = 1
        let validatedParentId = null

        if (parentId) {
            const parentCategory = await Category.findById(parentId)
            if (!parentCategory) {
                return res.status(400).json({
                    success: false,
                    error: 'Catégorie parent introuvable'
                })
            }

            // Vérifier que le niveau ne dépasse pas 3
            if (parentCategory.niveau >= 3) {
                return res.status(400).json({
                    success: false,
                    error: 'Impossible de créer plus de 3 niveaux de catégories'
                })
            }

            niveau = parentCategory.niveau + 1
            validatedParentId = parentId
        }

        // Préparer les données de la catégorie
        const categoryData = {
            nom: nom.trim(),
            slug: slug.toLowerCase().trim(),
            description: description?.trim(),
            niveau,
            parentId: validatedParentId
        }

        // Gérer l'icône selon son type
        if (icon) {
            if (typeof icon === 'object' && icon.public_id) {
                // C'est un objet Cloudinary
                categoryData.icon = {
                    public_id: icon.public_id,
                    secure_url: icon.secure_url,
                    width: icon.width,
                    height: icon.height,
                    format: icon.format,
                    size: icon.size
                }
            } else if (typeof icon === 'string') {
                // C'est une chaîne (ancien format ou emoji)
                categoryData.icon = {
                    secure_url: icon.trim()
                }
            }
        }

        console.log('Données à sauvegarder:', categoryData)

        // Création de la nouvelle catégorie
        const newCategory = new Category(categoryData)
        await newCategory.save()

        // Population du parent pour la réponse
        await newCategory.populate('parentId', 'nom slug niveau')

        console.log('Catégorie créée avec succès:', newCategory._id)

        return res.status(201).json({
            success: true,
            data: newCategory,
            message: 'Catégorie créée avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la création de la catégorie:', error)

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
            error: 'Erreur serveur lors de la création de la catégorie'
        })
    }
}