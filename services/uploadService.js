import apiClient from './api'

export const uploadService = {
    // Test de connexion Cloudinary
    testCloudinary: async () => {
        try {
            const response = await apiClient.get('/test-cloudinary')
            return response
        } catch (error) {
            console.error('Erreur test Cloudinary:', error)
            throw error
        }
    },

    // Upload d'une icône de catégorie vers Cloudinary
    uploadCategoryIcon: async (file, oldPublicId = null) => {
        console.log('Upload service called:', { fileName: file.name, size: file.size, type: file.type })

        const formData = new FormData()
        formData.append('icon', file)
        if (oldPublicId) {
            formData.append('oldPublicId', oldPublicId)
        }

        try {
            console.log('Envoi vers API...')
            const response = await apiClient.post('/upload/category-icon', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 300000, // 30 secondes timeout
            })

            console.log('Réponse API reçue:', response)
            return response
        } catch (error) {
            console.error('Erreur uploadService.uploadCategoryIcon:')
            console.error('Status:', error.response?.status)
            console.error('Data:', error.response?.data)
            console.error('Message:', error.message)
            throw error
        }
    },

    // Supprimer une image Cloudinary
    deleteCloudinaryImage: async (publicId) => {
        try {
            const response = await apiClient.delete('/upload/delete-cloudinary', {
                data: { publicId }
            })
            return response
        } catch (error) {
            console.error('Erreur uploadService.deleteCloudinaryImage:', error)
            throw error
        }
    },

    uploadVendeurImage: async (file, imageType, oldPublicId = null) => {
        console.log('UploadService.uploadVendeurImage appelé:', {
            fileName: file.name,
            size: file.size,
            type: file.type,
            imageType
        })

        const formData = new FormData()
        formData.append(imageType, file)
        formData.append('imageType', imageType)
        if (oldPublicId) {
            formData.append('oldPublicId', oldPublicId)
        }

        try {
            console.log('Envoi vers API upload vendeur...')
            const response = await apiClient.post('/upload/vendeur-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 300000,
            })

            console.log('Upload vendeur réponse:', response)
            return response
        } catch (error) {
            console.error('Erreur uploadService.uploadVendeurImage:', error)
            throw error
        }
    },

    // Test de connexion Cloudinary (réutilisable)
    testCloudinary: async () => {
        try {
            const response = await apiClient.get('/test-cloudinary')
            return response
        } catch (error) {
            console.error('Erreur test Cloudinary:', error)
            throw error
        }
    },

    // Supprimer une image Cloudinary (réutilisable)
    deleteCloudinaryImage: async (publicId) => {
        try {
            const response = await apiClient.delete('/upload/delete-cloudinary', {
                data: { publicId }
            })
            return response
        } catch (error) {
            console.error('Erreur uploadService.deleteCloudinaryImage:', error)
            throw error
        }
    },
    uploadAnnonceImages: async (files, oldPublicIds = []) => {
        console.log("UploadService.uploadAnnonceImages appelé:", {
            filesCount: files.length,
            oldPublicIdsCount: oldPublicIds.length,
        })

        const formData = new FormData()

        // Ajouter tous les fichiers
        for (let i = 0; i < files.length; i++) {
            formData.append(`image_${i}`, files[i])
        }

        // Ajouter les anciens public_ids pour suppression
        if (oldPublicIds.length > 0) {
            formData.append("oldPublicIds", JSON.stringify(oldPublicIds))
        }

        try {
            console.log("Envoi vers API upload annonce images...")
            const response = await apiClient.post("/upload/annonce-images", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 600000 * 5,
            })

            console.log("Upload annonce images réponse:", response)
            return response
        } catch (error) {
            console.error("Erreur uploadService.uploadAnnonceImages:", error)
            throw error
        }
    },
}

// Fonction de debug pour tester l'upload côté front
export const debugUpload = async (file) => {
    console.log('=== DEBUG UPLOAD FRONT ===')
    console.log('File:', file)
    console.log('File name:', file.name)
    console.log('File size:', file.size, 'bytes')
    console.log('File type:', file.type)
    console.log('File last modified:', new Date(file.lastModified))

    // Test de lecture du fichier
    if (file.type.startsWith('image/')) {
        try {
            const imageUrl = URL.createObjectURL(file)
            console.log('Image URL créée:', imageUrl)
            // N'oubliez pas de libérer l'URL après usage
            // URL.revokeObjectURL(imageUrl)
        } catch (error) {
            console.error('Erreur création URL:', error)
        }
    }
}

// Ajout dans le composant CategoryModal - fonction de debug
const CategoryModal = ({ category, parentCategories, onClose, onSuccess }) => {
    // ... autres states existants ...

    // Version corrigée de handleIconUpload avec debug complet
    const handleIconUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        console.log('=== DEBUT UPLOAD FRONT ===')
        console.log('Fichier sélectionné:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified)
        })

        // Vérifications côté client
        const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/avif']
        if (!allowedTypes.includes(file.type)) {
            setError('Format de fichier non supporté. Utilisez SVG, PNG, JPG, AVIF, GIF ou WebP.')
            return
        }

        if (file.size > 30 * 1024 * 1024) { // 5MB max
            setError('Le fichier est trop volumineux (max 30MB)')
            return
        }

        try {
            setUploadLoading(true)
            setError('')

            console.log('Test de connexion Cloudinary...')
            // Test Cloudinary en premier
            try {
                const testResult = await uploadService.testCloudinary()
                console.log('Test Cloudinary:', testResult)
                if (!testResult.data.connected) {
                    throw new Error('Cloudinary non connecté')
                }
            } catch (testError) {
                console.error('Erreur test Cloudinary:', testError)
                setError('Problème de connexion Cloudinary. Vérifiez la configuration.')
                return
            }

            console.log('Upload du fichier...')
            // Upload vers Cloudinary (avec remplacement automatique de l'ancienne)
            const response = await uploadService.uploadCategoryIcon(
                file,
                formData.icon?.public_id // Ancien public_id pour suppression auto
            )

            console.log('Upload réussi:', response)

            if (response.success) {
                setFormData(prev => ({
                    ...prev,
                    icon: {
                        public_id: response.data.public_id,
                        secure_url: response.data.secure_url,
                        width: response.data.width,
                        height: response.data.height,
                        format: response.data.format,
                        size: response.data.size
                    }
                }))

                console.log('State mis à jour avec nouvelle image')
            }

        } catch (error) {
            console.error('=== ERREUR UPLOAD FRONT ===')
            console.error('Error:', error)
            console.error('Response:', error.response?.data)

            const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de l\'upload'
            setError(errorMessage)
        } finally {
            setUploadLoading(false)
        }
    }

    // ... reste du composant identique ...
}