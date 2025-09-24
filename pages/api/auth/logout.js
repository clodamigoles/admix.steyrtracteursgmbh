export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    try {
        // Dans un système JWT stateless, la déconnexion se fait côté client
        // En supprimant le token du localStorage/sessionStorage
        // Ici on peut juste confirmer la déconnexion

        return res.status(200).json({
            success: true,
            message: 'Déconnexion réussie'
        })

    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la déconnexion'
        })
    }
}