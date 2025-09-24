import jwt from 'jsonwebtoken'

import { connectDB } from '@/lib/mongodb'
import { User } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
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

        const token = authHeader.substring(7)

        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            return res.status(500).json({
                success: false,
                error: 'Configuration serveur manquante'
            })
        }

        // Vérifier le token (même expiré, on veut juste récupérer les données)
        let decoded
        try {
            decoded = jwt.verify(token, jwtSecret)
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                decoded = jwt.decode(token)
            } else {
                throw error
            }
        }

        await connectDB()

        // Vérifier que l'utilisateur existe et est actif
        const user = await User.findById(decoded.userId)

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Utilisateur non autorisé'
            })
        }

        // Créer un nouveau token
        const newToken = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role
            },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        )

        return res.status(200).json({
            success: true,
            message: 'Token rafraîchi',
            token: newToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin
            }
        })

    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors du rafraîchissement'
        })
    }
}