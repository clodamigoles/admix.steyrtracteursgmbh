import apiClient from './api'

export const categoryService = {
    // Récupérer toutes les catégories
    getAll: async (params = {}) => {
        const response = await apiClient.get('/categories', { params })
        return response
    },

    // Récupérer une catégorie par ID
    getById: async (id) => {
        const response = await apiClient.get(`/categories/${id}`)
        return response
    },

    // Récupérer les catégories par niveau
    getByNiveau: async (niveau) => {
        const response = await apiClient.get(`/categories?niveau=${niveau}`)
        return response
    },

    // Récupérer les sous-catégories d'une catégorie parent
    getChildren: async (parentId) => {
        const response = await apiClient.get(`/categories?parentId=${parentId}`)
        return response
    },

    // Créer une nouvelle catégorie
    create: async (categoryData) => {
        const response = await apiClient.post('/categories', categoryData)
        return response
    },

    // Mettre à jour une catégorie
    update: async (id, categoryData) => {
        const response = await apiClient.put(`/categories/${id}`, categoryData)
        return response
    },

    // Supprimer une catégorie
    delete: async (id) => {
        const response = await apiClient.delete(`/categories/${id}`)
        return response
    },

    // Récupérer l'arbre des catégories
    getTree: async () => {
        const response = await apiClient.get('/categories/tree')
        return response
    }
}