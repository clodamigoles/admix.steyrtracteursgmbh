import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Fonction pour uploader une image
export async function uploadImage(filePath, folder = 'categories') {
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

// Fonction pour supprimer une image
export async function deleteImage(publicId) {
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

// Test de connexion Cloudinary
export async function testCloudinaryConnection() {
    try {
        const result = await cloudinary.api.ping()
        console.log('Connexion Cloudinary OK:', result)
        return true
    } catch (error) {
        console.error('Erreur connexion Cloudinary:', error)
        return false
    }
}

export default cloudinary