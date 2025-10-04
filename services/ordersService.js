import apiClient from "./api"

export const ordersService = {
    // Récupérer toutes les commandes
    getAll: async (params = {}) => {
        const response = await apiClient.get("/orders", { params })
        return response
    },

    // Récupérer une commande par ID
    getById: async (id) => {
        const response = await apiClient.get(`/orders/${id}`)
        return response
    },

    // Créer une nouvelle commande
    create: async (orderData) => {
        const response = await apiClient.post("/orders", orderData)
        return response
    },

    // Mettre à jour une commande
    update: async (id, orderData) => {
        const response = await apiClient.put(`/orders/${id}`, orderData)
        return response
    },

    // Supprimer une commande
    delete: async (id) => {
        const response = await apiClient.delete(`/orders/${id}`)
        return response
    },

    // Changer le statut d'une commande
    updateStatut: async (id, statut, note = "") => {
        const response = await apiClient.patch(`/orders/${id}/statut`, { statut, note })
        return response
    },

    // Récupérer les commandes par annonce
    getByAnnonce: async (annonceId) => {
        const response = await apiClient.get(`/orders/annonce/${annonceId}`)
        return response
    },

    // Rechercher des commandes
    search: async (query) => {
        const response = await apiClient.get(`/orders/search?q=${query}`)
        return response
    },

    // Exporter les commandes (CSV)
    export: async (filters = {}) => {
        const response = await apiClient.get("/orders/export", {
            params: filters,
            responseType: "blob",
        })
        return response
    },

    // Valider le paiement d'une commande
    validerPaiement: async (id, validationData) => {
        const response = await apiClient.post(`/orders/${id}/valider-paiement`, validationData)
        return response
    },

    // Upload bordereau de paiement
    uploadBordereau: async (file) => {
        const formData = new FormData()
        formData.append("bordereau", file)

        const response = await apiClient.post("/upload/order-bordereau", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
        return response
    },
}