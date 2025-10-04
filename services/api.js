import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Instance Axios configurée
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Intercepteur pour ajouter le token d'auth si nécessaire
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Intercepteur pour gérer les erreurs globalement
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token')
            window.location.href = '/admin/login'
        }
        return Promise.reject(error)
    }
)

export default apiClient