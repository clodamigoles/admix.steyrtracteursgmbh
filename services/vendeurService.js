import apiClient from './api'

export const vendeurService = {
    // Récupérer tous les vendeurs
    getAll: async (params = {}) => {
        try {
            console.log('VendeurService.getAll appelé avec params:', params)
            const response = await apiClient.get('/vendeurs', { params })
            console.log('VendeurService.getAll réponse:', response.data?.length, 'vendeurs')
            return response
        } catch (error) {
            console.error('Erreur vendeurService.getAll:', error)
            throw error
        }
    },

    // Récupérer un vendeur par ID
    getById: async (id) => {
        try {
            const response = await apiClient.get(`/vendeurs/${id}`)
            return response
        } catch (error) {
            console.error('Erreur vendeurService.getById:', error)
            throw error
        }
    },

    // Créer un nouveau vendeur
    create: async (vendeurData) => {
        try {
            console.log('VendeurService.create appelé avec:', vendeurData)

            // Les données sont envoyées en JSON, pas en FormData
            const response = await apiClient.post('/vendeurs', vendeurData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            console.log('VendeurService.create réponse:', response)
            return response
        } catch (error) {
            console.error('Erreur vendeurService.create:', error)
            throw error
        }
    },

    // Mettre à jour un vendeur
    update: async (id, vendeurData) => {
        try {
            console.log('VendeurService.update appelé avec:', id, vendeurData)

            const response = await apiClient.put(`/vendeurs/${id}`, vendeurData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            console.log('VendeurService.update réponse:', response)
            return response
        } catch (error) {
            console.error('Erreur vendeurService.update:', error)
            throw error
        }
    },

    // Supprimer un vendeur
    delete: async (id) => {
        try {
            const response = await apiClient.delete(`/vendeurs/${id}`)
            return response
        } catch (error) {
            console.error('Erreur vendeurService.delete:', error)
            throw error
        }
    },

    // Activer/désactiver un vendeur
    toggleActivite: async (id) => {
        try {
            const response = await apiClient.patch(`/vendeurs/${id}/toggle-activite`)
            return response
        } catch (error) {
            console.error('Erreur vendeurService.toggleActivite:', error)
            throw error
        }
    },

    // Rechercher des vendeurs
    search: async (query) => {
        try {
            const response = await apiClient.get(`/vendeurs/search?q=${query}`)
            return response
        } catch (error) {
            console.error('Erreur vendeurService.search:', error)
            throw error
        }
    }
}