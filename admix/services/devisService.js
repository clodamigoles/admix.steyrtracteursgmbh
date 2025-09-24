import apiClient from './api'

export const devisService = {
    // Récupérer tous les devis
    getAll: async (params = {}) => {
        const response = await apiClient.get('/devis', { params })
        return response
    },

    // Récupérer un devis par ID
    getById: async (id) => {
        const response = await apiClient.get(`/devis/${id}`)
        return response
    },

    // Créer un nouveau devis
    create: async (devisData) => {
        const response = await apiClient.post('/devis', devisData)
        return response
    },

    // Mettre à jour un devis
    update: async (id, devisData) => {
        const response = await apiClient.put(`/devis/${id}`, devisData)
        return response
    },

    // Supprimer un devis
    delete: async (id) => {
        const response = await apiClient.delete(`/devis/${id}`)
        return response
    },

    // Changer le statut d'un devis
    updateStatut: async (id, statut, note = '') => {
        const response = await apiClient.patch(`/devis/${id}/statut`, { statut, note })
        return response
    },

    // Récupérer les devis par annonce
    getByAnnonce: async (annonceId) => {
        const response = await apiClient.get(`/devis/annonce/${annonceId}`)
        return response
    },

    // Rechercher des devis
    search: async (query) => {
        const response = await apiClient.get(`/devis/search?q=${query}`)
        return response
    },

    // Exporter les devis (CSV)
    export: async (filters = {}) => {
        const response = await apiClient.get('/devis/export', {
            params: filters,
            responseType: 'blob'
        })
        return response
    }
}