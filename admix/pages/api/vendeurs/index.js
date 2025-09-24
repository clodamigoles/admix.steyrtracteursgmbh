import { connectDB } from '@/lib/mongodb'
import Vendeur from '@/models/Vendeur'

export default async function handler(req, res) {
    console.log('=== API VENDEURS ===')
    console.log('Method:', req.method)

    await connectDB()

    switch (req.method) {
        case 'GET':
            return await getVendeurs(req, res)
        case 'POST':
            return await createVendeur(req, res)
        default:
            return res.status(405).json({
                success: false,
                error: 'Méthode non autorisée'
            })
    }
}

// GET /api/vendeurs
async function getVendeurs(req, res) {
    try {
        console.log('GET vendeurs avec params:', req.query)

        const {
            page = 1,
            limit = 20,
            search,
            activite,
            sortBy = 'nom',
            sortOrder = 'asc'
        } = req.query

        // Construction du filtre
        const filter = {}

        if (activite !== undefined && activite !== '') {
            filter.activite = activite === 'true'
        }

        if (search) {
            filter.$or = [
                { nom: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { ville: { $regex: search, $options: 'i' } }
            ]
        }

        console.log('Filtre MongoDB:', filter)

        // Options de tri
        const sortOptions = {}
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // Exécution de la requête
        const [vendeurs, total] = await Promise.all([
            Vendeur.find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Vendeur.countDocuments(filter)
        ])

        console.log('Vendeurs trouvés:', vendeurs.length)
        console.log('Premier vendeur:', vendeurs[0]?.nom)

        // Calcul de pagination
        const totalPages = Math.ceil(total / parseInt(limit))
        const hasNext = parseInt(page) < totalPages
        const hasPrevious = parseInt(page) > 1

        return res.status(200).json({
            success: true,
            data: vendeurs,
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
        console.error('Erreur lors de la récupération des vendeurs:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des vendeurs'
        })
    }
}

// POST /api/vendeurs
async function createVendeur(req, res) {
    try {
        console.log('POST vendeur avec body:', req.body)

        const {
            nom,
            logo,
            couverture,
            avisNote,
            activite,
            email,
            telephone,
            adresse,
            ville,
            codePostal,
            pays,
            description
        } = req.body

        // Validation du nom requis
        if (!nom) {
            return res.status(400).json({
                success: false,
                error: 'Le nom du vendeur est requis'
            })
        }

        // Préparer les données vendeur
        const vendeurData = {
            nom: nom.trim(),
            avisNote: parseFloat(avisNote) || 0,
            activite: activite !== undefined ? Boolean(activite) : true,
            email: email?.trim().toLowerCase(),
            telephone: telephone?.trim(),
            adresse: adresse?.trim(),
            ville: ville?.trim(),
            codePostal: codePostal?.trim(),
            pays: pays?.trim() || 'France',
            description: description?.trim()
        }

        // Gérer le logo selon son type
        if (logo) {
            if (typeof logo === 'object' && logo.public_id) {
                vendeurData.logo = {
                    public_id: logo.public_id,
                    secure_url: logo.secure_url,
                    width: logo.width,
                    height: logo.height,
                    format: logo.format,
                    size: logo.size
                }
            }
        }

        // Gérer la couverture selon son type
        if (couverture) {
            if (typeof couverture === 'object' && couverture.public_id) {
                vendeurData.couverture = {
                    public_id: couverture.public_id,
                    secure_url: couverture.secure_url,
                    width: couverture.width,
                    height: couverture.height,
                    format: couverture.format,
                    size: couverture.size
                }
            }
        }

        console.log('Données à sauvegarder:', vendeurData)

        // Création du vendeur
        const newVendeur = new Vendeur(vendeurData)
        await newVendeur.save()

        console.log('Vendeur créé avec succès:', newVendeur._id)

        return res.status(201).json({
            success: true,
            data: newVendeur,
            message: 'Vendeur créé avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la création du vendeur:', error)

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message)
            return res.status(400).json({
                success: false,
                error: 'Erreur de validation: ' + validationErrors.join(', ')
            })
        }

        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la création du vendeur'
        })
    }
}