import formidable from "formidable"
import path from "path"
import fs from "fs"

import { connectDB } from "@/lib/mongodb"
import { Annonce, Vendeur, Category } from "@/models"

export const config = {
    api: {
        bodyParser: false,
    },
}

export default async function handler(req, res) {
    await connectDB()

    switch (req.method) {
        case "GET":
            return await getAnnonces(req, res)
        case "POST":
            return await createAnnonce(req, res)
        default:
            return res.status(405).json({
                success: false,
                error: "Méthode non autorisée",
            })
    }
}

// GET /api/annonces
async function getAnnonces(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            statut,
            categorieId,
            vendeurId,
            marque,
            etat,
            typeCarburant,
            prixMin,
            prixMax,
            anneeMin,
            anneeMax,
            pays,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query

        // Construction du filtre
        const filter = {}

        if (statut) {
            filter.statut = statut
        }

        if (categorieId) {
            filter.categorieId = categorieId
        }

        if (vendeurId) {
            filter.vendeurId = vendeurId
        }

        if (marque) {
            filter.marque = { $regex: marque, $options: "i" }
        }

        if (etat) {
            filter.etat = etat
        }

        if (typeCarburant) {
            filter.typeCarburant = typeCarburant
        }

        if (pays) {
            filter.pays = { $regex: pays, $options: "i" }
        }

        // Filtres de prix
        if (prixMin || prixMax) {
            filter.prix = {}
            if (prixMin) filter.prix.$gte = Number.parseFloat(prixMin)
            if (prixMax) filter.prix.$lte = Number.parseFloat(prixMax)
        }

        // Filtres d'année
        if (anneeMin || anneeMax) {
            filter.annee = {}
            if (anneeMin) filter.annee.$gte = Number.parseInt(anneeMin)
            if (anneeMax) filter.annee.$lte = Number.parseInt(anneeMax)
        }

        // Recherche textuelle
        if (search) {
            filter.$or = [
                { titre: { $regex: search, $options: "i" } },
                { marque: { $regex: search, $options: "i" } },
                { modele: { $regex: search, $options: "i" } },
                { plusInfos: { $regex: search, $options: "i" } },
            ]
        }

        // Options de tri
        const sortOptions = {}
        if (sortBy === "prix" || sortBy === "annee" || sortBy === "stats.vues") {
            sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1
        } else {
            sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1
        }

        // Pagination
        const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

        // Exécution de la requête avec populations
        const [annonces, total] = await Promise.all([
            Annonce.find(filter)
                .populate("categorieId", "nom slug niveau")
                .populate("vendeurId", "nom email telephone ville logo avisNote activite")
                .sort(sortOptions)
                .skip(skip)
                .limit(Number.parseInt(limit))
                .lean(),
            Annonce.countDocuments(filter),
        ])

        // Calcul de pagination
        const totalPages = Math.ceil(total / Number.parseInt(limit))
        const hasNext = Number.parseInt(page) < totalPages
        const hasPrevious = Number.parseInt(page) > 1

        return res.status(200).json({
            success: true,
            data: annonces,
            pagination: {
                page: Number.parseInt(page),
                limit: Number.parseInt(limit),
                total,
                totalPages,
                hasNext,
                hasPrevious,
            },
        })
    } catch (error) {
        console.error("Erreur lors de la récupération des annonces:", error)
        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors de la récupération des annonces",
        })
    }
}

// POST /api/annonces
async function createAnnonce(req, res) {
    try {
        const contentType = req.headers["content-type"]

        if (contentType && contentType.includes("application/json")) {
            return await createAnnonceFromJSON(req, res)
        } else {
            // Handle FormData request with local file uploads (existing logic)
            return await createAnnonceFromFormData(req, res)
        }
    } catch (error) {
        console.error("Erreur lors de la création de l'annonce:", error)
        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors de la création de l'annonce",
        })
    }
}

async function createAnnonceFromJSON(req, res) {
    let annonceData
    try {
        if (typeof req.body === "string") {
            annonceData = JSON.parse(req.body)
        } else if (typeof req.body === "object" && req.body !== null) {
            annonceData = req.body
        } else {
            // Read raw body data
            const chunks = []
            for await (const chunk of req) {
                chunks.push(chunk)
            }
            const rawBody = Buffer.concat(chunks).toString()
            annonceData = JSON.parse(rawBody)
        }
    } catch (error) {
        console.error("Erreur lors du parsing JSON:", error)
        return res.status(400).json({
            success: false,
            error: "Format JSON invalide",
        })
    }

    console.log("[v0] Parsed annonceData:", annonceData)

    // Validation des champs requis
    const requiredFields = [
        "titre",
        "marque",
        "pays",
        "etat",
        "prix",
        "annee",
        "typeCarburant",
        "categorieId",
        "vendeurId",
    ]
    for (const field of requiredFields) {
        if (!annonceData[field]) {
            return res.status(400).json({
                success: false,
                error: `Le champ ${field} est requis`,
            })
        }
    }

    // Vérifier que la catégorie existe
    const categorie = await Category.findById(annonceData.categorieId)
    if (!categorie) {
        return res.status(400).json({
            success: false,
            error: "Catégorie introuvable",
        })
    }

    // Vérifier que le vendeur existe
    const vendeur = await Vendeur.findById(annonceData.vendeurId)
    if (!vendeur) {
        return res.status(400).json({
            success: false,
            error: "Vendeur introuvable",
        })
    }

    // Conversion des types numériques
    const numericFields = ["prix", "annee", "poids", "hauteur", "longueur", "largeur", "puissance", "kilometrage"]
    numericFields.forEach((field) => {
        if (annonceData[field]) {
            annonceData[field] = Number.parseFloat(annonceData[field])
        }
    })

    // Création de l'annonce
    const newAnnonce = new Annonce({
        titre: annonceData.titre.trim(),
        marque: annonceData.marque.trim(),
        modele: annonceData.modele?.trim(),
        pays: annonceData.pays.trim(),
        etat: annonceData.etat,
        prix: annonceData.prix,
        devise: annonceData.devise || "EUR",
        annee: annonceData.annee,
        typeCarburant: annonceData.typeCarburant,
        poids: annonceData.poids,
        hauteur: annonceData.hauteur,
        longueur: annonceData.longueur,
        largeur: annonceData.largeur,
        puissance: annonceData.puissance,
        kilometrage: annonceData.kilometrage,
        photos: annonceData.photos || [], // Direct use of Cloudinary URLs
        caracteristiques: annonceData.caracteristiques || [],
        plusInfos: annonceData.plusInfos?.trim(),
        categorieId: annonceData.categorieId,
        vendeurId: annonceData.vendeurId,
        statut: annonceData.statut || "active",
        stats: {
            vues: 0,
            favoris: 0,
            postedAt: new Date(),
        },
    })

    await newAnnonce.save()

    // Population pour la réponse
    await newAnnonce.populate("categorieId", "nom slug niveau")
    await newAnnonce.populate("vendeurId", "nom email telephone ville logo avisNote activite")

    return res.status(201).json({
        success: true,
        data: newAnnonce,
        message: "Annonce créée avec succès",
    })
}

async function createAnnonceFromFormData(req, res) {
    const form = formidable({
        uploadDir: "./public/uploads/annonces",
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB par fichier
        multiples: true,
        maxFiles: 10, // Maximum 10 photos
    })

    // Créer le dossier s'il n'existe pas
    const uploadDir = "./public/uploads/annonces"
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
    }

    const [fields, files] = await form.parse(req)

    // Extraire les valeurs des champs
    const annonceData = {}
    Object.keys(fields).forEach((key) => {
        if (key === "caracteristiques") {
            try {
                annonceData[key] = JSON.parse(fields[key][0])
            } catch (e) {
                annonceData[key] = []
            }
        } else {
            annonceData[key] = fields[key][0]
        }
    })

    // Validation des champs requis
    const requiredFields = [
        "titre",
        "marque",
        "pays",
        "etat",
        "prix",
        "annee",
        "typeCarburant",
        "categorieId",
        "vendeurId",
    ]
    for (const field of requiredFields) {
        if (!annonceData[field]) {
            return res.status(400).json({
                success: false,
                error: `Le champ ${field} est requis`,
            })
        }
    }

    // Vérifier que la catégorie existe
    const categorie = await Category.findById(annonceData.categorieId)
    if (!categorie) {
        return res.status(400).json({
            success: false,
            error: "Catégorie introuvable",
        })
    }

    // Vérifier que le vendeur existe
    const vendeur = await Vendeur.findById(annonceData.vendeurId)
    if (!vendeur) {
        return res.status(400).json({
            success: false,
            error: "Vendeur introuvable",
        })
    }

    // Traitement des photos
    const photoPaths = []
    if (files.photos) {
        const photoFiles = Array.isArray(files.photos) ? files.photos : [files.photos]

        for (const photoFile of photoFiles) {
            if (photoFile && photoFile.size > 0) {
                const photoPath = await savePhotoFile(photoFile)
                photoPaths.push(photoPath)
            }
        }
    }

    // Conversion des types numériques
    const numericFields = ["prix", "annee", "poids", "hauteur", "longueur", "largeur", "puissance", "kilometrage"]
    numericFields.forEach((field) => {
        if (annonceData[field]) {
            annonceData[field] = Number.parseFloat(annonceData[field])
        }
    })

    // Création de l'annonce
    const newAnnonce = new Annonce({
        titre: annonceData.titre.trim(),
        marque: annonceData.marque.trim(),
        modele: annonceData.modele?.trim(),
        pays: annonceData.pays.trim(),
        etat: annonceData.etat,
        prix: annonceData.prix,
        devise: annonceData.devise || "EUR",
        annee: annonceData.annee,
        typeCarburant: annonceData.typeCarburant,
        poids: annonceData.poids,
        hauteur: annonceData.hauteur,
        longueur: annonceData.longueur,
        largeur: annonceData.largeur,
        puissance: annonceData.puissance,
        kilometrage: annonceData.kilometrage,
        photos: photoPaths,
        caracteristiques: annonceData.caracteristiques || [],
        plusInfos: annonceData.plusInfos?.trim(),
        categorieId: annonceData.categorieId,
        vendeurId: annonceData.vendeurId,
        statut: annonceData.statut || "active",
        stats: {
            vues: 0,
            favoris: 0,
            postedAt: new Date(),
        },
    })

    await newAnnonce.save()

    // Population pour la réponse
    await newAnnonce.populate("categorieId", "nom slug niveau")
    await newAnnonce.populate("vendeurId", "nom email telephone ville logo avisNote activite")

    return res.status(201).json({
        success: true,
        data: newAnnonce,
        message: "Annonce créée avec succès",
    })
}

// Fonction utilitaire pour sauvegarder les photos
async function savePhotoFile(file) {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = path.extname(file.originalFilename)
    const filename = `photo_${timestamp}_${randomString}${extension}`
    const newPath = `./public/uploads/annonces/${filename}`

    // Déplacer le fichier
    fs.renameSync(file.filepath, newPath)

    // Retourner le chemin relatif pour la DB
    return `/uploads/annonces/${filename}`
}