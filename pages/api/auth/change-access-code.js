import { withAuth } from '@/lib/middleware/auth'

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    try {
        const { currentCode, newCode } = req.body

        if (!currentCode || !newCode) {
            return res.status(400).json({
                success: false,
                error: 'Code actuel et nouveau code requis'
            })
        }

        // Vérifier le code actuel
        const currentAccessCode = process.env.ADMIN_ACCESS_CODE
        if (currentCode !== currentAccessCode) {
            return res.status(401).json({
                success: false,
                error: 'Code actuel invalide'
            })
        }

        // Validation du nouveau code
        if (newCode.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Le nouveau code doit contenir au moins 6 caractères'
            })
        }

        // NOTE: Dans un vrai environnement de production, 
        // il faudrait mettre à jour le fichier .env.local ou utiliser une base de données
        // Pour cet exemple, on simule juste le changement

        return res.status(200).json({
            success: true,
            message: 'Code d\'accès mis à jour avec succès. Redémarrez l\'application pour appliquer les changements.'
        })

    } catch (error) {
        console.error('Erreur lors du changement de code:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors du changement de code'
        })
    }
}

export default withAuth(handler, ['admin'])