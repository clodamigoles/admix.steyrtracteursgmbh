import formidable from 'formidable'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

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

// Fonction pour uploader vers Cloudinary
async function uploadToCloudinary(filePath, folder = 'categories') {
    try {
        console.log('Upload vers Cloudinary:', { filePath, folder })

        // Vérifier que le fichier existe
        if (!fs.existsSync(filePath)) {
            throw new Error('Fichier non trouvé: ' + filePath)
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder: `annonces/${folder}`,
            resource_type: 'auto',
            quality: 'auto:good',
            fetch_format: 'auto',
            transformation: [
                { width: 200, height: 200, crop: 'fit' },
                { quality: 'auto:good' }
            ]
        })

        console.log('Upload Cloudinary réussi:', result.public_id)

        return {
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
        }
    } catch (error) {
        console.error('Erreur upload Cloudinary:', error)
        throw new Error(`Erreur Cloudinary: ${error.message}`)
    }
}

// Fonction pour supprimer de Cloudinary
async function deleteFromCloudinary(publicId) {
    try {
        console.log('Suppression Cloudinary:', publicId)
        const result = await cloudinary.uploader.destroy(publicId)
        console.log('Suppression réussie:', result)
        return result
    } catch (error) {
        console.error('Erreur suppression Cloudinary:', error)
        throw new Error(`Erreur suppression Cloudinary: ${error.message}`)
    }
}

// Handler principal de la route API
export default async function handler(req, res) {
    console.log('=== DEBUT UPLOAD CATEGORY ICON ===')
    console.log('Method:', req.method)

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    try {
        // Vérifier la configuration Cloudinary
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('Variables Cloudinary manquantes')
            return res.status(500).json({
                success: false,
                error: 'Configuration Cloudinary manquante. Vérifiez vos variables d\'environnement.'
            })
        }

        // Créer un dossier temporaire
        const tempDir = './temp-uploads'
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        const form = formidable({
            uploadDir: tempDir,
            keepExtensions: true,
            maxFileSize: 5 * 1024 * 1024, // 5MB max
            multiples: false,
            filter: function ({ name, originalFilename, mimetype }) {
                console.log('Filtrage fichier:', { name, originalFilename, mimetype })

                // Accepter seulement les images
                const allowedTypes = [
                    'image/svg+xml', 'image/png', 'image/jpeg',
                    'image/jpg', 'image/gif', 'image/webp'
                ]

                return name === 'icon' && allowedTypes.includes(mimetype)
            }
        })

        console.log('Parsing form data...')
        const [fields, files] = await form.parse(req)
        console.log('Fields:', Object.keys(fields))
        console.log('Files:', Object.keys(files))

        if (!files.icon || !files.icon[0]) {
            return res.status(400).json({
                success: false,
                error: 'Aucun fichier d\'icône fourni'
            })
        }

        const iconFile = files.icon[0]
        console.log('Fichier reçu:', {
            originalFilename: iconFile.originalFilename,
            mimetype: iconFile.mimetype,
            size: iconFile.size,
            filepath: iconFile.filepath
        })

        // Vérifier le type de fichier
        const allowedTypes = [
            'image/svg+xml', 'image/png', 'image/jpeg',
            'image/jpg', 'image/gif', 'image/webp'
        ]

        if (!allowedTypes.includes(iconFile.mimetype)) {
            // Nettoyer le fichier temporaire
            if (fs.existsSync(iconFile.filepath)) {
                fs.unlinkSync(iconFile.filepath)
            }

            return res.status(400).json({
                success: false,
                error: 'Type de fichier non supporté. Utilisez SVG, PNG, JPG, GIF ou WebP.'
            })
        }

        // Supprimer l'ancienne image si fournie
        const oldPublicId = fields.oldPublicId?.[0]
        if (oldPublicId) {
            try {
                console.log('Suppression ancienne image:', oldPublicId)
                await deleteFromCloudinary(oldPublicId)
                console.log('Ancienne image supprimée avec succès')
            } catch (error) {
                console.log('Erreur lors de la suppression de l\'ancienne image:', error.message)
                // Ne pas faire échouer l'upload pour ça
            }
        }

        // Upload vers Cloudinary
        console.log('Upload vers Cloudinary...')
        const cloudinaryResult = await uploadToCloudinary(iconFile.filepath, 'categories')
        console.log('Cloudinary result:', cloudinaryResult)

        // Nettoyer le fichier temporaire
        try {
            if (fs.existsSync(iconFile.filepath)) {
                fs.unlinkSync(iconFile.filepath)
                console.log('Fichier temporaire nettoyé')
            }
        } catch (error) {
            console.log('Erreur nettoyage fichier temp:', error)
        }

        console.log('=== UPLOAD REUSSI ===')
        return res.status(200).json({
            success: true,
            data: {
                public_id: cloudinaryResult.public_id,
                secure_url: cloudinaryResult.secure_url,
                width: cloudinaryResult.width,
                height: cloudinaryResult.height,
                format: cloudinaryResult.format,
                size: cloudinaryResult.bytes,
                originalName: iconFile.originalFilename
            },
            message: 'Image uploadée avec succès'
        })

    } catch (error) {
        console.error('=== ERREUR UPLOAD ===')
        console.error('Error stack:', error.stack)
        console.error('Error message:', error.message)

        return res.status(500).json({
            success: false,
            error: `Erreur serveur: ${error.message}`,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
    }
}