import { connectDB } from '@/lib/mongodb'
import { Devis } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    await connectDB()

    try {
        const {
            statut,
            dateStart,
            dateEnd,
            ville,
            format = 'csv'
        } = req.query

        // Construction du filtre
        const filter = {}
        if (statut) filter.statut = statut
        if (ville) filter.ville = { $regex: ville, $options: 'i' }

        if (dateStart || dateEnd) {
            filter.createdAt = {}
            if (dateStart) filter.createdAt.$gte = new Date(dateStart)
            if (dateEnd) {
                const endDate = new Date(dateEnd)
                endDate.setHours(23, 59, 59, 999)
                filter.createdAt.$lte = endDate
            }
        }

        // Récupérer les données
        const devisList = await Devis.find(filter)
            .populate({
                path: 'annonceId',
                select: 'titre marque modele prix devise'
            })
            .sort({ createdAt: -1 })
            .lean()

        if (format === 'csv') {
            // Générer le CSV
            const csvHeaders = [
                'Date de création',
                'Nom',
                'Prénom',
                'Email',
                'Téléphone',
                'Adresse',
                'Ville',
                'Code postal',
                'Canton',
                'Annonce',
                'Statut',
                'Message'
            ]

            const csvRows = devisList.map(devis => [
                new Date(devis.createdAt).toLocaleDateString('fr-FR'),
                devis.nom,
                devis.prenom,
                devis.email,
                devis.telephone,
                `${devis.numeroRue} ${devis.rue}`,
                devis.ville,
                devis.codePostal,
                devis.canton || '',
                devis.annonceTitre || (devis.annonceId ? devis.annonceId.titre : ''),
                devis.statut,
                devis.message || ''
            ])

            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','))
                .join('\n')

            res.setHeader('Content-Type', 'text/csv charset=utf-8')
            res.setHeader('Content-Disposition', `attachment filename="devis-export-${new Date().toISOString().split('T')[0]}.csv"`)

            // Ajouter BOM UTF-8 pour Excel
            return res.status(200).send('\uFEFF' + csvContent)
        }

        // Format JSON par défaut
        return res.status(200).json({
            success: true,
            data: devisList,
            count: devisList.length
        })

    } catch (error) {
        console.error('Erreur lors de l\'export des devis:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de l\'export'
        })
    }
}