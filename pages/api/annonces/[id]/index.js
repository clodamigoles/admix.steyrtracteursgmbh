import formidable from "formidable"
import fs from "fs"
import path from "path"

import { connectDB } from "@/lib/mongodb"
import { Annonce } from "@/models"

export const config = {
    api: {
        bodyParser: false,
    },
}

export default async function handler(req, res) {
    await connectDB()

    const { id } = req.query

    switch (req.method) {
        case "GET":
            return await getAnnonceById(req, res, id)
        case "PUT":
            return await updateAnnonce(req, res, id)
        case "DELETE":
            return await deleteAnnonce(req, res, id)
        default:
            return res.status(405).json({
                success: false,
                error: "Méthode non autorisée",
            })
    }
}

// GET /api/annonces/[id]
async function getAnnonceById(req, res, id) {
    try {
        const annonce = await Annonce.findById(id)
            .populate("categorieId", "nom slug niveau parentId")
            .populate("vendeurId", "nom email telephone ville logo avisNote activite")

        if (!annonce) {
            return res.status(404).json({
                success: false,
                error: "Annonce introuvable",
            })
        }

        return res.status(200).json({
            success: true,
            data: annonce,
        })
    } catch (error) {
        console.error("Erreur lors de la récupération de l'annonce:", error)
        return res.status(500).json({
            success: false,
            error: "Erreur serveur",
        })
    }
}

// PUT /api/annonces/[id]
async function updateAnnonce(req, res, id) {
    try {
        // Vérifier que l'annonce existe
        const existingAnnonce = await Annonce.findById(id)
        if (!existingAnnonce) {
            return res.status(404).json({
                success: false,
                error: "Annonce introuvable",
            })
        }

        const contentType = req.headers["content-type"]

        if (contentType && contentType.includes("application/json")) {
            // Handle JSON request with Cloudinary URLs
            return await updateAnnonceFromJSON(req, res, id, existingAnnonce)
        } else {
            // Handle FormData request with local file uploads (existing logic)
            return await updateAnnonceFromFormData(req, res, id, existingAnnonce)
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'annonce:", error)
        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors de la mise à jour",
        })
    }
}

async function updateAnnonceFromJSON(req, res, id, existingAnnonce) {
    const annonceData = req.body

    // Validation des champs requis
    if (!annonceData.titre || !annonceData.marque) {
        return res.status(400).json({
            success: false,
            error: "Le titre et la marque sont requis",
        })
    }

    // Conversion des types numériques
    const numericFields = ["prix", "annee", "poids", "hauteur", "longueur", "largeur", "puissance", "kilometrage"]
    numericFields.forEach((field) => {
        if (annonceData[field]) {
            annonceData[field] = Number.parseFloat(annonceData[field])
        }
    })

    // Mise à jour de l'annonce
    const updatedAnnonce = await Annonce.findByIdAndUpdate(
        id,
        {
            titre: annonceData.titre.trim(),
            marque: annonceData.marque.trim(),
            modele: annonceData.modele?.trim(),
            pays: annonceData.pays?.trim() || existingAnnonce.pays,
            etat: annonceData.etat || existingAnnonce.etat,
            prix: annonceData.prix || existingAnnonce.prix,
            devise: annonceData.devise || existingAnnonce.devise,
            annee: annonceData.annee || existingAnnonce.annee,
            typeCarburant: annonceData.typeCarburant || existingAnnonce.typeCarburant,
            poids: annonceData.poids,
            hauteur: annonceData.hauteur,
            longueur: annonceData.longueur,
            largeur: annonceData.largeur,
            puissance: annonceData.puissance,
            kilometrage: annonceData.kilometrage,
            photos: annonceData.photos || existingAnnonce.photos, // Direct use of Cloudinary URLs
            caracteristiques: annonceData.caracteristiques || existingAnnonce.caracteristiques,
            plusInfos: annonceData.plusInfos?.trim(),
            categorieId: annonceData.categorieId || existingAnnonce.categorieId,
            vendeurId: annonceData.vendeurId || existingAnnonce.vendeurId,
            statut: annonceData.statut || existingAnnonce.statut,
        },
        { new: true, runValidators: true },
    )
        .populate("categorieId", "nom slug niveau")
        .populate("vendeurId", "nom email telephone ville logo")

    return res.status(200).json({
        success: true,
        data: updatedAnnonce,
        message: "Annonce mise à jour avec succès",
    })
}

async function updateAnnonceFromFormData(req, res, id, existingAnnonce) {
    const form = formidable({
        uploadDir: "./public/uploads/annonces",
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024,
        multiples: true,
        maxFiles: 10,
    })

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
    if (!annonceData.titre || !annonceData.marque) {
        return res.status(400).json({
            success: false,
            error: "Le titre et la marque sont requis",
        })
    }

    // Traitement des nouvelles photos
    let photoPaths = existingAnnonce.photos || []

    // Si le champ removePhotos est présent, supprimer les photos spécifiées
    if (fields.removePhotos) {
        const photosToRemove = JSON.parse(fields.removePhotos[0])
        photosToRemove.forEach((photoPath) => {
            // Supprimer le fichier physique
            const fullPath = `./public${photoPath}`
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath)
            }
            // Retirer de la liste
            photoPaths = photoPaths.filter((p) => p !== photoPath)
        })
    }

    // Ajouter les nouvelles photos
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

    // Mise à jour de l'annonce
    const updatedAnnonce = await Annonce.findByIdAndUpdate(
        id,
        {
            titre: annonceData.titre.trim(),
            marque: annonceData.marque.trim(),
            modele: annonceData.modele?.trim(),
            pays: annonceData.pays?.trim() || existingAnnonce.pays,
            etat: annonceData.etat || existingAnnonce.etat,
            prix: annonceData.prix || existingAnnonce.prix,
            devise: annonceData.devise || existingAnnonce.devise,
            annee: annonceData.annee || existingAnnonce.annee,
            typeCarburant: annonceData.typeCarburant || existingAnnonce.typeCarburant,
            poids: annonceData.poids,
            hauteur: annonceData.hauteur,
            longueur: annonceData.longueur,
            largeur: annonceData.largeur,
            puissance: annonceData.puissance,
            kilometrage: annonceData.kilometrage,
            photos: photoPaths,
            caracteristiques: annonceData.caracteristiques || existingAnnonce.caracteristiques,
            plusInfos: annonceData.plusInfos?.trim(),
            categorieId: annonceData.categorieId || existingAnnonce.categorieId,
            vendeurId: annonceData.vendeurId || existingAnnonce.vendeurId,
            statut: annonceData.statut || existingAnnonce.statut,
        },
        { new: true, runValidators: true },
    )
        .populate("categorieId", "nom slug niveau")
        .populate("vendeurId", "nom email telephone ville logo")

    return res.status(200).json({
        success: true,
        data: updatedAnnonce,
        message: "Annonce mise à jour avec succès",
    })
}

// DELETE /api/annonces/[id]
async function deleteAnnonce(req, res, id) {
    try {
        const annonce = await Annonce.findById(id)
        if (!annonce) {
            return res.status(404).json({
                success: false,
                error: "Annonce introuvable",
            })
        }

        // Supprimer toutes les photos associées (seulement les photos locales)
        if (annonce.photos && annonce.photos.length > 0) {
            annonce.photos.forEach((photoPath) => {
                if (photoPath.startsWith("/uploads/")) {
                    const fullPath = `./public${photoPath}`
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath)
                    }
                }
            })
        }

        await Annonce.findByIdAndDelete(id)

        return res.status(200).json({
            success: true,
            message: "Annonce supprimée avec succès",
        })
    } catch (error) {
        console.error("Erreur lors de la suppression de l'annonce:", error)
        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors de la suppression",
        })
    }
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