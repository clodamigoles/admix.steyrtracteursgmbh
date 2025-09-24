import { connectDB } from '@/lib/mongodb'
import { Annonce, Devis, Recherche, Vendeur, Category } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    await connectDB()

    const { type } = req.query
    const { period = '7d' } = req.query

    try {
        // Déterminer la période et format de groupement
        const now = new Date()
        let startDate
        let groupByFormat
        let dateFormat

        switch (period) {
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
                groupByFormat = { $dateToString: { format: '%H:00', date: '$createdAt' } }
                dateFormat = 'hour'
                break
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                dateFormat = 'day'
                break
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                dateFormat = 'day'
                break
            case '3m':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                groupByFormat = { $dateToString: { format: '%Y-%U', date: '$createdAt' } }
                dateFormat = 'week'
                break
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
                dateFormat = 'month'
                break
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                dateFormat = 'day'
        }

        let chartData = {}

        switch (type) {
            case 'annonces':
                chartData = await getAnnoncesChart(startDate, groupByFormat)
                break
            case 'devis':
                chartData = await getDevisChart(startDate, groupByFormat)
                break
            case 'recherches':
                chartData = await getRecherchesChart(startDate, groupByFormat)
                break
            case 'vendeurs':
                chartData = await getVendeursChart(startDate, groupByFormat)
                break
            case 'categories':
                chartData = await getCategoriesChart()
                break
            case 'marques':
                chartData = await getMarquesChart()
                break
            case 'revenus':
                chartData = await getRevenusChart(startDate, groupByFormat)
                break
            case 'vues':
                chartData = await getVuesChart(startDate, groupByFormat)
                break
            case 'conversions':
                chartData = await getConversionsChart(startDate, groupByFormat)
                break
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Type de graphique non supporté'
                })
        }

        return res.status(200).json({
            success: true,
            data: chartData,
            meta: {
                type,
                period,
                dateFormat,
                generatedAt: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Erreur lors de la génération du graphique:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la génération du graphique'
        })
    }
}

// Fonction pour graphique des annonces
async function getAnnoncesChart(startDate, groupByFormat) {
    const pipeline = [
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: groupByFormat,
                total: { $sum: 1 },
                actives: { $sum: { $cond: [{ $eq: ['$statut', 'active'] }, 1, 0] } },
                vendues: { $sum: { $cond: [{ $eq: ['$statut', 'vendue'] }, 1, 0] } },
                suspendues: { $sum: { $cond: [{ $eq: ['$statut', 'suspendue'] }, 1, 0] } },
                brouillons: { $sum: { $cond: [{ $eq: ['$statut', 'brouillon'] }, 1, 0] } }
            }
        },
        { $sort: { _id: 1 } }
    ]

    const results = await Annonce.aggregate(pipeline)

    return {
        labels: results.map(r => r._id),
        datasets: [
            {
                label: 'Total créées',
                data: results.map(r => r.total),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
            },
            {
                label: 'Actives',
                data: results.map(r => r.actives),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true
            },
            {
                label: 'Vendues',
                data: results.map(r => r.vendues),
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true
            },
            {
                label: 'Suspendues',
                data: results.map(r => r.suspendues),
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true
            }
        ]
    }
}

// Fonction pour graphique des devis
async function getDevisChart(startDate, groupByFormat) {
    const pipeline = [
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: groupByFormat,
                total: { $sum: 1 },
                nouveaux: { $sum: { $cond: [{ $eq: ['$statut', 'nouveau'] }, 1, 0] } },
                en_cours: { $sum: { $cond: [{ $eq: ['$statut', 'en_cours'] }, 1, 0] } },
                envoyes: { $sum: { $cond: [{ $eq: ['$statut', 'envoye'] }, 1, 0] } },
                acceptes: { $sum: { $cond: [{ $eq: ['$statut', 'accepte'] }, 1, 0] } },
                refuses: { $sum: { $cond: [{ $eq: ['$statut', 'refuse'] }, 1, 0] } },
                expires: { $sum: { $cond: [{ $eq: ['$statut', 'expire'] }, 1, 0] } }
            }
        },
        { $sort: { _id: 1 } }
    ]

    const results = await Devis.aggregate(pipeline)

    return {
        labels: results.map(r => r._id),
        datasets: [
            {
                label: 'Total reçus',
                data: results.map(r => r.total),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
            },
            {
                label: 'Acceptés',
                data: results.map(r => r.acceptes),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
            },
            {
                label: 'Refusés',
                data: results.map(r => r.refuses),
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)'
            },
            {
                label: 'En cours',
                data: results.map(r => r.en_cours),
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)'
            }
        ]
    }
}

// Fonction pour graphique des recherches
async function getRecherchesChart(startDate, groupByFormat) {
    const pipeline = [
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: groupByFormat,
                total: { $sum: 1 },
                resultats_moyen: { $avg: '$resultatsCount' },
                resultats_total: { $sum: '$resultatsCount' }
            }
        },
        { $sort: { _id: 1 } }
    ]

    const results = await Recherche.aggregate(pipeline)

    return {
        labels: results.map(r => r._id),
        datasets: [
            {
                label: 'Nombre de recherches',
                data: results.map(r => r.total),
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                yAxisID: 'y'
            },
            {
                label: 'Résultats moyens',
                data: results.map(r => Math.round(r.resultats_moyen || 0)),
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                yAxisID: 'y1'
            }
        ]
    }
}

// Fonction pour graphique des vendeurs
async function getVendeursChart(startDate, groupByFormat) {
    const pipeline = [
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: groupByFormat,
                total: { $sum: 1 },
                actifs: { $sum: { $cond: ['$activite', 1, 0] } },
                inactifs: { $sum: { $cond: [{ $not: '$activite' }, 1, 0] } }
            }
        },
        { $sort: { _id: 1 } }
    ]

    const results = await Vendeur.aggregate(pipeline)

    return {
        labels: results.map(r => r._id),
        datasets: [
            {
                label: 'Nouveaux vendeurs',
                data: results.map(r => r.total),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
            },
            {
                label: 'Activés directement',
                data: results.map(r => r.actifs),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }
        ]
    }
}

// Fonction pour graphique des catégories (diagramme circulaire)
async function getCategoriesChart() {
    const pipeline = [
        {
            $lookup: {
                from: 'annonces',
                localField: '_id',
                foreignField: 'categorieId',
                pipeline: [
                    { $match: { statut: 'active' } }
                ],
                as: 'annonces'
            }
        },
        {
            $project: {
                nom: 1,
                niveau: 1,
                annoncesCount: { $size: '$annonces' }
            }
        },
        { $match: { annoncesCount: { $gt: 0 } } },
        { $sort: { annoncesCount: -1 } },
        { $limit: 10 }
    ]

    const results = await Category.aggregate(pipeline)

    const colors = [
        '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
        '#14B8A6', '#EC4899', '#6366F1', '#84CC16', '#F97316'
    ]

    return {
        labels: results.map(r => r.nom),
        datasets: [
            {
                label: 'Annonces par catégorie',
                data: results.map(r => r.annoncesCount),
                backgroundColor: colors.slice(0, results.length),
                borderColor: colors.slice(0, results.length).map(color => color),
                borderWidth: 1
            }
        ]
    }
}

// Fonction pour graphique des marques (barres horizontales)
async function getMarquesChart() {
    const pipeline = [
        { $match: { statut: 'active' } },
        { $group: { _id: '$marque', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
    ]

    const results = await Annonce.aggregate(pipeline)

    return {
        labels: results.map(r => r._id),
        datasets: [
            {
                label: 'Annonces actives',
                data: results.map(r => r.count),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3B82F6',
                borderWidth: 1
            }
        ]
    }
}

// Fonction pour graphique des revenus estimés
async function getRevenusChart(startDate, groupByFormat) {
    const pipeline = [
        {
            $match: {
                'stats.postedAt': { $gte: startDate },
                statut: { $in: ['active', 'vendue'] }
            }
        },
        {
            $group: {
                _id: groupByFormat,
                valeur_totale: { $sum: '$prix' },
                annonces: { $sum: 1 },
                prix_moyen: { $avg: '$prix' },
                prix_max: { $max: '$prix' },
                prix_min: { $min: '$prix' }
            }
        },
        { $sort: { _id: 1 } }
    ]

    const results = await Annonce.aggregate(pipeline)

    return {
        labels: results.map(r => r._id),
        datasets: [
            {
                label: 'Valeur totale (€)',
                data: results.map(r => Math.round(r.valeur_totale || 0)),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                yAxisID: 'y'
            },
            {
                label: 'Prix moyen (€)',
                data: results.map(r => Math.round(r.prix_moyen || 0)),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y1'
            }
        ]
    }
}

// Fonction pour graphique des vues
async function getVuesChart(startDate, groupByFormat) {
    const pipeline = [
        { $match: { 'stats.postedAt': { $gte: startDate } } },
        {
            $group: {
                _id: groupByFormat,
                total_vues: { $sum: '$stats.vues' },
                total_favoris: { $sum: '$stats.favoris' },
                annonces: { $sum: 1 },
                vues_moyennes: { $avg: '$stats.vues' }
            }
        },
        { $sort: { _id: 1 } }
    ]

    const results = await Annonce.aggregate(pipeline)

    return {
        labels: results.map(r => r._id),
        datasets: [
            {
                label: 'Total vues',
                data: results.map(r => r.total_vues),
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)'
            },
            {
                label: 'Total favoris',
                data: results.map(r => r.total_favoris),
                borderColor: '#EC4899',
                backgroundColor: 'rgba(236, 72, 153, 0.1)'
            }
        ]
    }
}

// Fonction pour graphique des conversions
async function getConversionsChart(startDate, groupByFormat) {
    // Récupérer les données d'annonces et de devis en parallèle
    const [annoncesPipeline, devisPipeline] = await Promise.all([
        Annonce.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: groupByFormat,
                    nouvelles_annonces: { $sum: 1 },
                    vues_totales: { $sum: '$stats.vues' }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        Devis.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: groupByFormat,
                    nouveaux_devis: { $sum: 1 },
                    devis_acceptes: { $sum: { $cond: [{ $eq: ['$statut', 'accepte'] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ])
    ])

    // Fusionner les données
    const merged = {}
    annoncesPipeline.forEach(item => {
        merged[item._id] = {
            ...item,
            nouveaux_devis: 0,
            devis_acceptes: 0
        }
    })

    devisPipeline.forEach(item => {
        if (merged[item._id]) {
            merged[item._id].nouveaux_devis = item.nouveaux_devis
            merged[item._id].devis_acceptes = item.devis_acceptes
        } else {
            merged[item._id] = {
                _id: item._id,
                nouvelles_annonces: 0,
                vues_totales: 0,
                ...item
            }
        }
    })

    const results = Object.values(merged).sort((a, b) => a._id.localeCompare(b._id))

    return {
        labels: results.map(r => r._id),
        datasets: [
            {
                label: 'Nouvelles annonces',
                data: results.map(r => r.nouvelles_annonces),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
            },
            {
                label: 'Devis reçus',
                data: results.map(r => r.nouveaux_devis),
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)'
            },
            {
                label: 'Devis acceptés',
                data: results.map(r => r.devis_acceptes),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }
        ]
    }
}