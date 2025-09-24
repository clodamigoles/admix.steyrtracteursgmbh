import apiClient from './api'

export const rechercheService = {
    // Enregistrer une recherche
    create: async (rechercheData) => {
        const response = await apiClient.post('/recherches', rechercheData)
        return response
    },

    // Récupérer les statistiques de recherche
    getStats: async (params = {}) => {
        const response = await apiClient.get('/recherches/stats', { params })
        return response
    },

    // Récupérer les recherches populaires
    getPopulaires: async (limit = 10) => {
        const response = await apiClient.get(`/recherches/populaires?limit=${limit}`)
        return response
    },

    // Récupérer les recherches par période
    getByPeriode: async (startDate, endDate) => {
        const response = await apiClient.get('/recherches/periode', {
            params: { startDate, endDate }
        })
        return response
    }
}