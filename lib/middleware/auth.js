import jwt from "jsonwebtoken"

import { User } from "@/models"
import { connectDB } from "../mongodb"

// Middleware pour authentifier les tokens
export async function authenticateToken(req, res, next) {
    try {
        // Récupérer le token depuis les cookies ou headers
        const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "")

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "Token manquant",
            })
        }

        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            return res.status(500).json({
                success: false,
                error: "Configuration serveur manquante",
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
                error: "Utilisateur non autorisé",
            })
        }

        // Ajouter l'utilisateur à la requête
        req.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        }

        // Continuer vers la route suivante
        if (next) {
            next()
        } else {
            return { success: true, user: req.user }
        }
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                error: "Token invalide",
            })
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                error: "Token expiré",
            })
        }

        console.error("Erreur d'authentification:", error)
        return res.status(500).json({
            success: false,
            error: "Erreur serveur d'authentification",
        })
    }
}

export const authMiddleware = authenticateToken

// Middleware pour vérifier les rôles
export function requireRole(allowedRoles = ["admin"]) {
    return async (req, res, next) => {
        try {
            // D'abord authentifier
            await authenticateToken(req, res)

            // Vérifier le rôle
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: "Permissions insuffisantes",
                })
            }

            if (next) {
                next()
            }
        } catch (error) {
            console.error("Erreur de vérification des permissions:", error)
            return res.status(500).json({
                success: false,
                error: "Erreur serveur de vérification des permissions",
            })
        }
    }
}

// Fonction utilitaire pour utiliser le middleware dans les API routes
export function withAuth(handler, allowedRoles = ["admin"]) {
    return async (req, res) => {
        try {
            // Authentifier et vérifier les rôles
            const authResult = await authenticateToken(req, res)
            if (!authResult || !authResult.success) {
                return // La réponse d'erreur a déjà été envoyée
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: "Permissions insuffisantes",
                })
            }

            // Exécuter le handler principal
            return await handler(req, res)
        } catch (error) {
            // Si l'erreur vient de l'authentification, elle est déjà gérée
            if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
                return
            }

            console.error("Erreur dans withAuth:", error)
            return res.status(500).json({
                success: false,
                error: "Erreur serveur",
            })
        }
    }
}