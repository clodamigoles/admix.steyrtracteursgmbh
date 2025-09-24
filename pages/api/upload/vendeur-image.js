import formidable from 'formidable'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

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
    console.log('=== UPLOAD VENDEUR IMAGE ===')
    console.log('Method:', req.method)

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return res.status(500).json({
                success: false,
                error: 'Configuration Cloudinary manquante.'
            })
        }

        const tempDir = './temp-uploads'
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        const form = formidable({
            uploadDir: tempDir,
            keepExtensions: true,
            maxFileSize: 5 * 1024 * 1024,
            multiples: false,
            filter: function ({ name, originalFilename, mimetype }) {
                console.log('Filter:', { name, originalFilename, mimetype })
                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
                return (name === 'logo' || name === 'couverture') && allowedTypes.includes(mimetype)
            }
        })

        const [fields, files] = await form.parse(req)
        console.log('Fields:', Object.keys(fields))
        console.log('Files:', Object.keys(files))

        const imageType = fields.imageType?.[0]
        const oldPublicId = fields.oldPublicId?.[0]

        console.log('Image type:', imageType)
        console.log('Old public ID:', oldPublicId)

        if (!files[imageType] || !files[imageType][0]) {
            return res.status(400).json({
                success: false,
                error: `Aucun fichier ${imageType} fourni`
            })
        }

        const imageFile = files[imageType][0]
        console.log('Image file:', {
            originalFilename: imageFile.originalFilename,
            mimetype: imageFile.mimetype,
            size: imageFile.size,
            filepath: imageFile.filepath
        })

        // Supprimer l'ancienne image si fournie
        if (oldPublicId) {
            try {
                console.log('Suppression ancienne image:', oldPublicId)
                await cloudinary.uploader.destroy(oldPublicId)
            } catch (error) {
                console.log('Erreur suppression ancienne image:', error)
            }
        }

        // Configuration d'upload selon le type
        const uploadConfig = {
            folder: `annonces/vendeurs/${imageType}`,
            resource_type: 'auto',
            quality: 'auto:good',
            fetch_format: 'auto'
        }

        if (imageType === 'logo') {
            uploadConfig.transformation = [
                { width: 200, height: 200, crop: 'fit' },
                { quality: 'auto:good' }
            ]
        } else if (imageType === 'couverture') {
            uploadConfig.transformation = [
                { width: 800, height: 400, crop: 'fill' },
                { quality: 'auto:good' }
            ]
        }

        console.log('Upload config:', uploadConfig)

        // Upload vers Cloudinary
        const result = await cloudinary.uploader.upload(imageFile.filepath, uploadConfig)
        console.log('Upload result:', result.public_id)

        // Nettoyer le fichier temporaire
        if (fs.existsSync(imageFile.filepath)) {
            fs.unlinkSync(imageFile.filepath)
        }

        return res.status(200).json({
            success: true,
            data: {
                public_id: result.public_id,
                secure_url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.bytes,
                originalName: imageFile.originalFilename
            },
            message: 'Image uploadée avec succès'
        })

    } catch (error) {
        console.error('=== ERREUR UPLOAD VENDEUR ===')
        console.error('Error:', error)
        return res.status(500).json({
            success: false,
            error: `Erreur serveur: ${error.message}`,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
    }
}