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
        const { accessCode } = req.body

        // Validation du code d'accès
        if (!accessCode) {
            return res.status(400).json({
                success: false,
                error: 'Code d\'accès requis'
            })
        }

        // Récupérer le code d'accès depuis les variables d'environnement
        const validAccessCode = process.env.ADMIN_ACCESS_CODE

        if (!validAccessCode) {
            console.error('ADMIN_ACCESS_CODE non défini dans .env.local')
            return res.status(500).json({
                success: false,
                error: 'Configuration serveur manquante'
            })
        }

        // Vérifier le code d'accès
        if (accessCode !== validAccessCode) {
            // Attendre un peu pour éviter les attaques par force brute
            await new Promise(resolve => setTimeout(resolve, 1000))

            return res.status(401).json({
                success: false,
                error: 'Code d\'accès invalide'
            })
        }

        await connectDB()

        // Créer ou récupérer l'utilisateur admin
        let adminUser = await User.findOne({ role: 'admin' })

        if (!adminUser) {
            // Créer l'utilisateur admin par défaut
            adminUser = new User({
                username: 'admin',
                email: process.env.ADMIN_EMAIL || 'admin@example.com',
                role: 'admin',
                isActive: true
            })
            await adminUser.save()
        }

        // Mettre à jour la dernière connexion
        adminUser.lastLogin = new Date()
        await adminUser.save()

        // Créer le token JWT
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            console.error('JWT_SECRET non défini dans .env.local')
            return res.status(500).json({
                success: false,
                error: 'Configuration serveur manquante'
            })
        }

        const token = jwt.sign(
            {
                userId: adminUser._id,
                username: adminUser.username,
                role: adminUser.role
            },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        )

        return res.status(200).json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id: adminUser._id,
                username: adminUser.username,
                email: adminUser.email,
                role: adminUser.role,
                lastLogin: adminUser.lastLogin
            }
        })

    } catch (error) {
        console.error('Erreur lors de la connexion:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la connexion'
        })
    }
}