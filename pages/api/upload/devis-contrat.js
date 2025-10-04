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
        return res.status(405).json({ success: false, error: "Méthode non autorisée" })
    }

    try {
        const form = new IncomingForm({
            maxFileSize: 10 * 1024 * 1024, // 10MB max
        })

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err)
                else resolve([fields, files])
            })
        })

        const file = Array.isArray(files.contrat) ? files.contrat[0] : files.contrat

        if (!file) {
            return res.status(400).json({ success: false, error: "Aucun fichier fourni" })
        }

        // Vérification PDF uniquement
        if (file.mimetype !== "application/pdf") {
            return res.status(400).json({ success: false, error: "Seuls les fichiers PDF sont acceptés" })
        }

        // Upload vers Cloudinary
        const result = await cloudinary.uploader.upload(file.filepath, {
            resource_type: "raw",
            folder: "ddevis",
            public_id: `devis${Date.now()}`,
        })

        // Nettoyage du fichier temporaire
        fs.unlinkSync(file.filepath)

        return res.status(200).json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
            },
        })
    } catch (error) {
        console.error("Erreur upload:", error)
        return res.status(500).json({ 
            success: false, 
            error: "Erreur lors de l'upload" 
        })
    }
}