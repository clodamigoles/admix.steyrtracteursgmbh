import apiClient from './api'

export const annonceService = {
    // Récupérer toutes les annonces avec pagination et filtres
    getAll: async (params = {}) => {
        const response = await apiClient.get('/annonces', { params })
        return response
    },

    // Récupérer une annonce par ID
    getById: async (id) => {
        const response = await apiClient.get(`/annonces/${id}`)
        return response
    },

    // Créer une nouvelle annonce
    create: async (annonceData) => {
        const formData = new FormData()

        // Ajouter les photos
        if (annonceData.photos && annonceData.photos.length > 0) {
            annonceData.photos.forEach((photo, index) => {
                if (photo instanceof File) {
                    formData.append(`photos`, photo)
                }
            })
        }

        // Ajouter les autres champs
        Object.keys(annonceData).forEach(key => {
            if (key === 'photos') return // Déjà traité

            if (key === 'caracteristiques') {
                formData.append(key, JSON.stringify(annonceData[key]))
            } else {
                formData.append(key, annonceData[key])
            }
        })

        const response = await apiClient.post('/annonces', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response
    },

    // Mettre à jour une annonce
    update: async (id, annonceData) => {
        const formData = new FormData()

        if (annonceData.photos && annonceData.photos.length > 0) {
            annonceData.photos.forEach((photo) => {
                if (photo instanceof File) {
                    formData.append(`photos`, photo)
                }
            })
        }

        Object.keys(annonceData).forEach(key => {
            if (key === 'photos') return

            if (key === 'caracteristiques') {
                formData.append(key, JSON.stringify(annonceData[key]))
            } else {
                formData.append(key, annonceData[key])
            }
        })

        const response = await apiClient.put(`/annonces/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response
    },

    // Supprimer une annonce
    delete: async (id) => {
        const response = await apiClient.delete(`/annonces/${id}`)
        return response
    },

    // Changer le statut d'une annonce
    updateStatut: async (id, statut) => {
        const response = await apiClient.patch(`/annonces/${id}/statut`, { statut })
        return response
    },

    // Incrémenter les vues
    incrementVues: async (id) => {
        const response = await apiClient.patch(`/annonces/${id}/vues`)
        return response
    },

    // Recherche avancée
    search: async (filters) => {
        const response = await apiClient.post('/annonces/search', filters)
        return response
    },

    // Récupérer les annonces par vendeur
    getByVendeur: async (vendeurId, params = {}) => {
        const response = await apiClient.get(`/annonces/vendeur/${vendeurId}`, { params })
        return response
    },

    // Récupérer les annonces par catégorie
    getByCategorie: async (categorieId, params = {}) => {
        const response = await apiClient.get(`/annonces/categorie/${categorieId}`, { params })
        return response
    },

    // Dupliquer une annonce
    duplicate: async (id) => {
        const response = await apiClient.post(`/annonces/${id}/duplicate`)
        return response
    }
}