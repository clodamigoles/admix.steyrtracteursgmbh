import jwt from 'jsonwebtoken'

import { connectDB } from '@/lib/mongodb'
import { User } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    try {
        // Récupérer le token depuis l'en-tête Authorization
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token manquant'
            })
        }

        const token = authHeader.substring(7) // Enlever "Bearer "

        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            return res.status(500).json({
                success: false,
                error: 'Configuration serveur manquante'
            })
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, jwtSecret)

        await connectDB()

        // Vérifier que l'utilisateur existe toujours et est actif
        const user = await User.findById(decoded.userId).select('-__v')

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Utilisateur non autorisé'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Token valide',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin
            }
        })

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token invalide'
            })
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expiré'
            })
        }

        console.error('Erreur lors de la vérification du token:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la vérification'
        })
    }
}