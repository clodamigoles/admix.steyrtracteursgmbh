import { IncomingForm } from "formidable"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const config = {
    api: {
        bodyParser: false,
    },
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" })
    }

    try {
        console.log("=== DEBUT UPLOAD ANNONCE IMAGES API ===")

        // Test de la configuration Cloudinary
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error("Configuration Cloudinary manquante")
            return res.status(500).json({
                error: "Configuration Cloudinary manquante",
                success: false,
            })
        }

        const form = new IncomingForm({
            maxFileSize: 30 * 1024 * 1024, // 10MB max par image
            maxFiles: 30, // Maximum 10 images
            keepExtensions: true,
            uploadDir: "/tmp",
        })

        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err)
                else resolve({ fields, files })
            })
        })

        console.log("Fichiers reçus:", Object.keys(files))
        console.log("Fields reçus:", fields)

        const uploadedImages = []
        const oldPublicIds = fields.oldPublicIds ? JSON.parse(fields.oldPublicIds[0]) : []

        // Supprimer les anciennes images si spécifiées
        if (oldPublicIds && oldPublicIds.length > 0) {
            console.log("Suppression des anciennes images:", oldPublicIds)
            try {
                for (const publicId of oldPublicIds) {
                    await cloudinary.uploader.destroy(publicId)
                    console.log(`Image supprimée: ${publicId}`)
                }
            } catch (error) {
                console.log("Erreur lors de la suppression des anciennes images:", error)
            }
        }

        // Upload des nouvelles images
        for (const [fieldName, fileArray] of Object.entries(files)) {
            const fileList = Array.isArray(fileArray) ? fileArray : [fileArray]

            for (const file of fileList) {
                if (!file || !file.filepath) continue

                console.log(`Upload de l'image: ${file.originalFilename}`)

                // Vérifications du fichier
                const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/avif"]
                if (!allowedTypes.includes(file.mimetype)) {
                    console.error(`Type de fichier non supporté: ${file.mimetype}`)
                    continue
                }

                try {
                    // Upload vers Cloudinary SANS compression (qualité maximale préservée)
                    const result = await cloudinary.uploader.upload(file.filepath, {
                        folder: "admix/annonces",
                        resource_type: "image",
                        // NOUVELLE CONFIGURATION : Qualité maximale préservée
                        quality: "100",  // Qualité maximale (pas de compression)
                        // Pas de redimensionnement automatique
                        // Pas de transformation appliquée
                        tags: ["annonce", "admix"],
                    })

                    console.log(`Image uploadée avec succès (qualité originale): ${result.public_id}`)

                    uploadedImages.push({
                        public_id: result.public_id,
                        secure_url: result.secure_url,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                        size: result.bytes,
                        original_filename: file.originalFilename,
                    })

                    // Nettoyer le fichier temporaire
                    try {
                        fs.unlinkSync(file.filepath)
                    } catch (cleanupError) {
                        console.log("Erreur nettoyage fichier temporaire:", cleanupError)
                    }
                } catch (uploadError) {
                    console.error(`Erreur upload ${file.originalFilename}:`, uploadError)
                    continue
                }
            }
        }

        console.log(`Upload terminé: ${uploadedImages.length} images uploadées (qualité originale)`)

        return res.status(200).json({
            success: true,
            data: uploadedImages,
            message: `${uploadedImages.length} image(s) uploadée(s) avec succès (qualité originale préservée)`,
        })
    } catch (error) {
        console.error("=== ERREUR UPLOAD ANNONCE IMAGES API ===")
        console.error("Error:", error)

        return res.status(500).json({
            error: error.message || "Erreur lors de l'upload des images",
            success: false,
        })
    }
}