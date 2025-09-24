import jwt from 'jsonwebtoken'

import { User } from '@/models'
import { connectDB } from '../mongodb'

export async function authenticateToken(req, res, next) {
    try {
        // Récupérer le token
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token d\'authentification manquant'
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

        // Vérifier le token
        const decoded = jwt.verify(token, jwtSecret)

        await connectDB()

        // Vérifier l'utilisateur
        const user = await User.findById(decoded.userId)
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Utilisateur non autorisé'
            })
        }

        // Ajouter l'utilisateur à la requête
        req.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }

        // Continuer vers la route suivante
        if (next) {
            next()
        } else {
            return req.user
        }

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

        console.error('Erreur d\'authentification:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur d\'authentification'
        })
    }
}

// Middleware pour vérifier les rôles
export function requireRole(allowedRoles = ['admin']) {
    return async (req, res, next) => {
        try {
            // D'abord authentifier
            await authenticateToken(req, res)

            // Vérifier le rôle
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: 'Permissions insuffisantes'
                })
            }

            if (next) {
                next()
            }

        } catch (error) {
            console.error('Erreur de vérification des permissions:', error)
            return res.status(500).json({
                success: false,
                error: 'Erreur serveur de vérification des permissions'
            })
        }
    }
}

// Fonction utilitaire pour utiliser le middleware dans les API routes
export function withAuth(handler, allowedRoles = ['admin']) {
    return async (req, res) => {
        try {
            // Authentifier et vérifier les rôles
            await authenticateToken(req, res)

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: 'Permissions insuffisantes'
                })
            }

            // Exécuter le handler principal
            return await handler(req, res)

        } catch (error) {
            // Si l'erreur vient de l'authentification, elle est déjà gérée
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return
            }

            console.error('Erreur dans withAuth:', error)
            return res.status(500).json({
                success: false,
                error: 'Erreur serveur'
            })
        }
    }
}