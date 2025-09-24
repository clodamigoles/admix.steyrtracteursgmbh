import apiClient from './api'

export const dashboardService = {
    // Récupérer les statistiques générales
    getStats: async () => {
        try {
            const response = await apiClient.get('/dashboard/stats')
            return response
        } catch (error) {
            console.error('Erreur dashboardService.getStats:', error)
            throw error
        }
    },

    // Récupérer les activités récentes
    getRecentActivities: async (limit = 10) => {
        try {
            const response = await apiClient.get(`/dashboard/activities?limit=${limit}`)
            return response
        } catch (error) {
            console.error('Erreur dashboardService.getRecentActivities:', error)
            throw error
        }
    },

    // Récupérer les données des graphiques
    getChartData: async (type, period = '7d') => {
        try {
            const response = await apiClient.get(`/dashboard/charts/${type}`, {
                params: { period }
            })
            return response
        } catch (error) {
            console.error('Erreur dashboardService.getChartData:', error)
            throw error
        }
    },

    // Récupérer les top performers
    getTopPerformers: async (type = 'annonces', limit = 5) => {
        try {
            const response = await apiClient.get(`/dashboard/top/${type}?limit=${limit}`)
            return response
        } catch (error) {
            console.error('Erreur dashboardService.getTopPerformers:', error)
            throw error
        }
    }
}