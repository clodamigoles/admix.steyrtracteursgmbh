import { connectDB } from '@/lib/mongodb'
import { Devis, Annonce, Vendeur } from '@/models'

export default async function handler(req, res) {
    await connectDB()

    switch (req.method) {
        case 'GET':
            return await getDevis(req, res)
        case 'POST':
            return await createDevis(req, res)
        default:
            return res.status(405).json({
                success: false,
                error: 'Méthode non autorisée'
            })
    }
}

// GET /api/devis
async function getDevis(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            statut,
            annonceId,
            dateStart,
            dateEnd,
            ville,
            canton,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query

        // Construction du filtre
        const filter = {}

        if (statut) {
            filter.statut = statut
        }

        if (annonceId) {
            filter.annonceId = annonceId
        }

        if (ville) {
            filter.ville = { $regex: ville, $options: 'i' }
        }

        if (canton) {
            filter.canton = { $regex: canton, $options: 'i' }
        }

        // Filtre par date
        if (dateStart || dateEnd) {
            filter.createdAt = {}
            if (dateStart) {
                filter.createdAt.$gte = new Date(dateStart)
            }
            if (dateEnd) {
                const endDate = new Date(dateEnd)
                endDate.setHours(23, 59, 59, 999)
                filter.createdAt.$lte = endDate
            }
        }

        // Recherche textuelle
        if (search) {
            filter.$or = [
                { nom: { $regex: search, $options: 'i' } },
                { prenom: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { telephone: { $regex: search, $options: 'i' } },
                { annonceTitre: { $regex: search, $options: 'i' } }
            ]
        }

        // Options de tri
        const sortOptions = {}
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // Exécution de la requête avec population
        const [devisList, total] = await Promise.all([
            Devis.find(filter)
                .populate({
                    path: 'annonceId',
                    select: 'titre marque modele prix devise photos statut vendeurId',
                    populate: {
                        path: 'vendeurId',
                        select: 'nom email telephone'
                    }
                })
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Devis.countDocuments(filter)
        ])

        // Calcul de pagination
        const totalPages = Math.ceil(total / parseInt(limit))
        const hasNext = parseInt(page) < totalPages
        const hasPrevious = parseInt(page) > 1

        return res.status(200).json({
            success: true,
            data: devisList,
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
        console.error('Erreur lors de la récupération des devis:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des devis'
        })
    }
}

// POST /api/devis
async function createDevis(req, res) {
    try {
        const {
            nom,
            prenom,
            email,
            telephone,
            numeroRue,
            rue,
            codePostal,
            ville,
            canton,
            pays,
            annonceId,
            message
        } = req.body

        // Validation des champs requis
        const requiredFields = {
            nom: 'Le nom est requis',
            prenom: 'Le prénom est requis',
            email: 'L\'email est requis',
            telephone: 'Le téléphone est requis',
            numeroRue: 'Le numéro de rue est requis',
            rue: 'La rue est requise',
            codePostal: 'Le code postal est requis',
            ville: 'La ville est requise',
            annonceId: 'L\'annonce est requise'
        }

        for (const [field, errorMessage] of Object.entries(requiredFields)) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    error: errorMessage
                })
            }
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Format d\'email invalide'
            })
        }

        // Vérifier que l'annonce existe et est active
        const annonce = await Annonce.findById(annonceId)
            .select('titre marque modele statut vendeurId')
            .populate('vendeurId', 'nom email')

        if (!annonce) {
            return res.status(400).json({
                success: false,
                error: 'Annonce introuvable'
            })
        }

        if (annonce.statut !== 'active') {
            return res.status(400).json({
                success: false,
                error: 'Cette annonce n\'est plus disponible'
            })
        }

        // Vérifier s'il y a déjà un devis récent de cette personne pour cette annonce (éviter le spam)
        const existingDevis = await Devis.findOne({
            email: email.toLowerCase().trim(),
            annonceId,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Dans les dernières 24h
        })

        if (existingDevis) {
            return res.status(400).json({
                success: false,
                error: 'Vous avez déjà fait une demande de devis pour cette annonce dans les dernières 24 heures'
            })
        }

        // Créer le titre de l'annonce pour dénormalisation
        const annonceTitre = `${annonce.marque}${annonce.modele ? ` ${annonce.modele}` : ''} - ${annonce.titre}`

        // Création du devis
        const newDevis = new Devis({
            nom: nom.trim(),
            prenom: prenom.trim(),
            email: email.toLowerCase().trim(),
            telephone: telephone.trim(),
            numeroRue: numeroRue.trim(),
            rue: rue.trim(),
            codePostal: codePostal.trim(),
            ville: ville.trim(),
            canton: canton?.trim(),
            pays: pays?.trim() || 'France',
            annonceId,
            annonceTitre,
            message: message?.trim(),
            statut: 'nouveau'
        })

        await newDevis.save()

        // Population pour la réponse
        await newDevis.populate({
            path: 'annonceId',
            select: 'titre marque modele prix devise photos',
            populate: {
                path: 'vendeurId',
                select: 'nom email telephone'
            }
        })

        return res.status(201).json({
            success: true,
            data: newDevis,
            message: 'Demande de devis envoyée avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la création du devis:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la création du devis'
        })
    }
}