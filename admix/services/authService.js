import apiClient from './api'

export const authService = {
    // Connexion avec code d'accès
    login: async (accessCode) => {
        try {
            const response = await apiClient.post('/auth/login', { accessCode })

            if (response.success && response.token) {
                localStorage.setItem('admin_token', response.token)
                localStorage.setItem('admin_user', JSON.stringify(response.user))
            }

            return response
        } catch (error) {
            console.error('Erreur authService.login:', error)
            throw error
        }
    },

    // Déconnexion
    logout: () => {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/admin/login'
    },

    // Vérifier si l'utilisateur est connecté
    isAuthenticated: () => {
        if (typeof window === 'undefined') return false
        return !!localStorage.getItem('admin_token')
    },

    // Récupérer l'utilisateur du localStorage
    getCurrentUser: () => {
        if (typeof window === 'undefined') return null
        const userStr = localStorage.getItem('admin_user')
        return userStr ? JSON.parse(userStr) : null
    },

    // Vérifier la validité du token
    verifyToken: async () => {
        try {
            const response = await apiClient.get('/auth/verify')
            return response
        } catch (error) {
            console.error('Erreur authService.verifyToken:', error)
            // Si le token est invalide, déconnecter
            if (error.response?.status === 401) {
                authService.logout()
            }
            throw error
        }
    }
}