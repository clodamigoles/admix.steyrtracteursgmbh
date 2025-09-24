import { connectDB } from '@/lib/mongodb'
import { Annonce, Vendeur, Category, Recherche, Devis } from '@/models'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Méthode non autorisée'
        })
    }

    await connectDB()

    const { type } = req.query
    const { limit = 10, period = '30d' } = req.query

    try {
        // Déterminer la période
        let dateFilter = {}
        if (period !== 'all') {
            const now = new Date()
            const days = parseInt(period.replace('d', ''))
            const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
            dateFilter = { createdAt: { $gte: startDate } }
        }

        let topData = []

        switch (type) {
            case 'annonces':
                topData = await getTopAnnonces(dateFilter, parseInt(limit))
                break
            case 'vendeurs':
                topData = await getTopVendeurs(dateFilter, parseInt(limit))
                break
            case 'categories':
                topData = await getTopCategories(dateFilter, parseInt(limit))
                break
            case 'marques':
                topData = await getTopMarques(dateFilter, parseInt(limit))
                break
            case 'recherches':
                topData = await getTopRecherches(dateFilter, parseInt(limit))
                break
            case 'villes':
                topData = await getTopVilles(dateFilter, parseInt(limit))
                break
            case 'prix':
                topData = await getTopPrix(dateFilter, parseInt(limit))
                break
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Type de classement non supporté'
                })
        }

        return res.status(200).json({
            success: true,
            data: topData,
            meta: {
                type,
                period,
                limit: parseInt(limit),
                generatedAt: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Erreur lors de la récupération du classement:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération du classement'
        })
    }
}

// Top annonces par vues/favoris
async function getTopAnnonces(dateFilter, limit) {
    const pipeline = [
        { $match: { ...dateFilter, statut: 'active' } },
        {
            $lookup: {
                from: 'vendeurs',
                localField: 'vendeurId',
                foreignField: '_id',
                as: 'vendeur'
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'categorieId',
                foreignField: '_id',
                as: 'categorie'
            }
        },
        { $unwind: '$vendeur' },
        { $unwind: '$categorie' },
        {
            $project: {
                titre: 1,
                marque: 1,
                modele: 1,
                prix: 1,
                devise: 1,
                annee: 1,
                vues: '$stats.vues',
                favoris: '$stats.favoris',
                createdAt: 1,
                'stats.postedAt': 1,
                vendeur: {
                    nom: '$vendeur.nom',
                    logo: '$vendeur.logo',
                    ville: '$vendeur.ville'
                },
                categorie: {
                    nom: '$categorie.nom',
                    niveau: '$categorie.niveau'
                },
                photo: { $arrayElemAt: ['$photos', 0] },
                score: { $add: ['$stats.vues', { $multiply: ['$stats.favoris', 5] }] }
            }
        },
        { $sort: { score: -1, vues: -1, favoris: -1 } },
        { $limit: limit }
    ]

    return await Annonce.aggregate(pipeline)
}

// Top vendeurs par performance
async function getTopVendeurs(dateFilter, limit) {
    const pipeline = [
        { $match: { activite: true } },
        {
            $lookup: {
                from: 'annonces',
                let: { vendeurId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$vendeurId', '$$vendeurId'] },
                            statut: 'active',
                            ...dateFilter
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAnnonces: { $sum: 1 },
                            totalVues: { $sum: '$stats.vues' },
                            totalFavoris: { $sum: '$stats.favoris' },
                            prixMoyen: { $avg: '$prix' },
                            prixMax: { $max: '$prix' },
                            annoncesVendues: { $sum: { $cond: [{ $eq: ['$statut', 'vendue'] }, 1, 0] } }
                        }
                    }
                ],
                as: 'statsAnnonces'
            }
        },
        {
            $lookup: {
                from: 'devis',
                let: { vendeurId: '$_id' },
                pipeline: [
                    {
                        $lookup: {
                            from: 'annonces',
                            localField: 'annonceId',
                            foreignField: '_id',
                            as: 'annonce'
                        }
                    },
                    { $unwind: '$annonce' },
                    {
                        $match: {
                            $expr: { $eq: ['$annonce.vendeurId', '$$vendeurId'] },
                            ...dateFilter
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalDevis: { $sum: 1 },
                            devisAcceptes: { $sum: { $cond: [{ $eq: ['$statut', 'accepte'] }, 1, 0] } },
                            devisRefuses: { $sum: { $cond: [{ $eq: ['$statut', 'refuse'] }, 1, 0] } }
                        }
                    }
                ],
                as: 'statsDevis'
            }
        },
        {
            $project: {
                nom: 1,
                email: 1,
                telephone: 1,
                ville: 1,
                logo: 1,
                avisNote: 1,
                createdAt: 1,
                annonces: { $ifNull: [{ $arrayElemAt: ['$statsAnnonces.totalAnnonces', 0] }, 0] },
                vues: { $ifNull: [{ $arrayElemAt: ['$statsAnnonces.totalVues', 0] }, 0] },
                favoris: { $ifNull: [{ $arrayElemAt: ['$statsAnnonces.totalFavoris', 0] }, 0] },
                prixMoyen: { $round: [{ $ifNull: [{ $arrayElemAt: ['$statsAnnonces.prixMoyen', 0] }, 0] }, 0] },
                prixMax: { $ifNull: [{ $arrayElemAt: ['$statsAnnonces.prixMax', 0] }, 0] },
                annoncesVendues: { $ifNull: [{ $arrayElemAt: ['$statsAnnonces.annoncesVendues', 0] }, 0] },
                devis: { $ifNull: [{ $arrayElemAt: ['$statsDevis.totalDevis', 0] }, 0] },
                devisAcceptes: { $ifNull: [{ $arrayElemAt: ['$statsDevis.devisAcceptes', 0] }, 0] },
                tauxAcceptation: {
                    $cond: [
                        { $gt: [{ $ifNull: [{ $arrayElemAt: ['$statsDevis.totalDevis', 0] }, 0] }, 0] },
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        { $ifNull: [{ $arrayElemAt: ['$statsDevis.devisAcceptes', 0] }, 0] },
                                        { $ifNull: [{ $arrayElemAt: ['$statsDevis.totalDevis', 0] }, 1] }
                                    ]
                                },
                                100
                            ]
                        },
                        0
                    ]
                }
            }
        },
        { $match: { annonces: { $gt: 0 } } },
        {
            $addFields: {
                score: {
                    $add: [
                        { $multiply: ['$annonces', 10] },
                        { $multiply: ['$vues', 0.1] },
                        { $multiply: ['$favoris', 2] },
                        { $multiply: ['$devisAcceptes', 50] }
                    ]
                }
            }
        },
        { $sort: { score: -1, annonces: -1, vues: -1 } },
        { $limit: limit }
    ]

    return await Vendeur.aggregate(pipeline)
}

// Top catégories par activité
async function getTopCategories(dateFilter, limit) {
    const pipeline = [
        {
            $lookup: {
                from: 'annonces',
                let: { categorieId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$categorieId', '$$categorieId'] },
                            statut: 'active',
                            ...dateFilter
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAnnonces: { $sum: 1 },
                            totalVues: { $sum: '$stats.vues' },
                            totalFavoris: { $sum: '$stats.favoris' },
                            prixMoyen: { $avg: '$prix' },
                            prixMax: { $max: '$prix' },
                            prixMin: { $min: '$prix' }
                        }
                    }
                ],
                as: 'stats'
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'parentId',
                foreignField: '_id',
                as: 'parent'
            }
        },
        {
            $project: {
                nom: 1,
                slug: 1,
                niveau: 1,
                icon: 1,
                parent: { $arrayElemAt: ['$parent.nom', 0] },
                annonces: { $ifNull: [{ $arrayElemAt: ['$stats.totalAnnonces', 0] }, 0] },
                vues: { $ifNull: [{ $arrayElemAt: ['$stats.totalVues', 0] }, 0] },
                favoris: { $ifNull: [{ $arrayElemAt: ['$stats.totalFavoris', 0] }, 0] },
                prixMoyen: { $round: [{ $ifNull: [{ $arrayElemAt: ['$stats.prixMoyen', 0] }, 0] }, 0] },
                prixMax: { $ifNull: [{ $arrayElemAt: ['$stats.prixMax', 0] }, 0] },
                prixMin: { $ifNull: [{ $arrayElemAt: ['$stats.prixMin', 0] }, 0] }
            }
        },
        { $match: { annonces: { $gt: 0 } } },
        { $sort: { annonces: -1, vues: -1 } },
        { $limit: limit }
    ]

    return await Category.aggregate(pipeline)
}

// Top marques par popularité
async function getTopMarques(dateFilter, limit) {
    const pipeline = [
        { $match: { statut: 'active', ...dateFilter } },
        {
            $group: {
                _id: '$marque',
                totalAnnonces: { $sum: 1 },
                totalVues: { $sum: '$stats.vues' },
                totalFavoris: { $sum: '$stats.favoris' },
                prixMoyen: { $avg: '$prix' },
                prixMax: { $max: '$prix' },
                prixMin: { $min: '$prix' },
                anneeRecente: { $max: '$annee' },
                anneeAncienne: { $min: '$annee' },
                modeles: { $addToSet: '$modele' },
                vendeurs: { $addToSet: '$vendeurId' },
                countries: { $addToSet: '$pays' }
            }
        },
        {
            $lookup: {
                from: 'devis',
                let: { marque: '$_id' },
                pipeline: [
                    {
                        $lookup: {
                            from: 'annonces',
                            localField: 'annonceId',
                            foreignField: '_id',
                            as: 'annonce'
                        }
                    },
                    { $unwind: '$annonce' },
                    { $match: { $expr: { $eq: ['$annonce.marque', '$$marque'] } } },
                    {
                        $group: {
                            _id: null,
                            totalDevis: { $sum: 1 },
                            devisAcceptes: { $sum: { $cond: [{ $eq: ['$statut', 'accepte'] }, 1, 0] } }
                        }
                    }
                ],
                as: 'devisStats'
            }
        },
        {
            $project: {
                marque: '$_id',
                annonces: '$totalAnnonces',
                vues: '$totalVues',
                favoris: '$totalFavoris',
                prixMoyen: { $round: ['$prixMoyen', 0] },
                prixMax: '$prixMax',
                prixMin: '$prixMin',
                anneeRecente: '$anneeRecente',
                anneeAncienne: '$anneeAncienne',
                modelesCount: { $size: { $filter: { input: '$modeles', cond: { $ne: ['$$this', null] } } } },
                vendeursCount: { $size: '$vendeurs' },
                paysCount: { $size: '$countries' },
                devis: { $ifNull: [{ $arrayElemAt: ['$devisStats.totalDevis', 0] }, 0] },
                devisAcceptes: { $ifNull: [{ $arrayElemAt: ['$devisStats.devisAcceptes', 0] }, 0] },
                tauxDevis: {
                    $cond: [
                        { $gt: ['$totalAnnonces', 0] },
                        { $multiply: [{ $divide: [{ $ifNull: [{ $arrayElemAt: ['$devisStats.totalDevis', 0] }, 0] }, '$totalAnnonces'] }, 100] },
                        0
                    ]
                }
            }
        },
        {
            $addFields: {
                score: {
                    $add: [
                        { $multiply: ['$annonces', 10] },
                        { $multiply: ['$vues', 0.05] },
                        { $multiply: ['$favoris', 1] },
                        { $multiply: ['$devisAcceptes', 20] }
                    ]
                }
            }
        },
        { $sort: { score: -1, annonces: -1, vues: -1 } },
        { $limit: limit }
    ]

    return await Annonce.aggregate(pipeline)
}

// Top termes de recherche
async function getTopRecherches(dateFilter, limit) {
    const pipeline = [
        { $match: dateFilter },
        {
            $group: {
                _id: {
                    marque: '$marque',
                    categorieId: '$categorieId'
                },
                totalRecherches: { $sum: 1 },
                resultatsModyen: { $avg: '$resultatsCount' },
                dernièreRecherche: { $max: '$createdAt' },
                premièreRecherche: { $min: '$createdAt' }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id.categorieId',
                foreignField: '_id',
                as: 'categorie'
            }
        },
        {
            $project: {
                marque: '$_id.marque',
                categorie: { $arrayElemAt: ['$categorie.nom', 0] },
                recherches: '$totalRecherches',
                resultatsModyen: { $round: ['$resultatsModyen', 1] },
                dernièreRecherche: '$dernièreRecherche',
                premièreRecherche: '$premièreRecherche',
                tendance: {
                    $cond: [
                        { $gte: ['$totalRecherches', 10] },
                        'populaire',
                        { $cond: [{ $gte: ['$totalRecherches', 5] }, 'modéré', 'faible'] }
                    ]
                }
            }
        },
        { $sort: { recherches: -1 } },
        { $limit: limit }
    ]

    return await Recherche.aggregate(pipeline)
}

// Top villes par activité vendeurs/devis
async function getTopVilles(dateFilter, limit) {
    const pipeline = [
        { $match: dateFilter },
        {
            $group: {
                _id: '$ville',
                totalDevis: { $sum: 1 },
                devisAcceptes: { $sum: { $cond: [{ $eq: ['$statut', 'accepte'] }, 1, 0] } },
                devisRefuses: { $sum: { $cond: [{ $eq: ['$statut', 'refuse'] }, 1, 0] } },
                dernierDevis: { $max: '$createdAt' },
                cantons: { $addToSet: '$canton' }
            }
        },
        {
            $lookup: {
                from: 'vendeurs',
                localField: '_id',
                foreignField: 'ville',
                as: 'vendeurs'
            }
        },
        {
            $project: {
                ville: '$_id',
                totalDevis: 1,
                devisAcceptes: 1,
                devisRefuses: 1,
                dernierDevis: 1,
                cantonsCount: { $size: { $filter: { input: '$cantons', cond: { $ne: ['$$this', null] } } } },
                vendeursCount: { $size: '$vendeurs' },
                vendeursActifs: {
                    $size: {
                        $filter: {
                            input: '$vendeurs',
                            cond: { $eq: ['$$this.activite', true] }
                        }
                    }
                },
                tauxAcceptation: {
                    $cond: [
                        { $gt: ['$totalDevis', 0] },
                        { $multiply: [{ $divide: ['$devisAcceptes', '$totalDevis'] }, 100] },
                        0
                    ]
                }
            }
        },
        { $match: { totalDevis: { $gt: 0 } } },
        { $sort: { totalDevis: -1, vendeursActifs: -1 } },
        { $limit: limit }
    ]

    return await Devis.aggregate(pipeline)
}

// Top annonces par prix (plus chères)
async function getTopPrix(dateFilter, limit) {
    const pipeline = [
        { $match: { ...dateFilter, statut: 'active', prix: { $gt: 0 } } },
        {
            $lookup: {
                from: 'vendeurs',
                localField: 'vendeurId',
                foreignField: '_id',
                as: 'vendeur'
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'categorieId',
                foreignField: '_id',
                as: 'categorie'
            }
        },
        {
            $lookup: {
                from: 'devis',
                localField: '_id',
                foreignField: 'annonceId',
                as: 'devis'
            }
        },
        { $unwind: '$vendeur' },
        { $unwind: '$categorie' },
        {
            $project: {
                titre: 1,
                marque: 1,
                modele: 1,
                prix: 1,
                devise: 1,
                annee: 1,
                etat: 1,
                pays: 1,
                vues: '$stats.vues',
                favoris: '$stats.favoris',
                createdAt: 1,
                vendeur: {
                    nom: '$vendeur.nom',
                    ville: '$vendeur.ville',
                    avisNote: '$vendeur.avisNote'
                },
                categorie: {
                    nom: '$categorie.nom'
                },
                photo: { $arrayElemAt: ['$photos', 0] },
                devisCount: { $size: '$devis' },
                devisAcceptes: {
                    $size: {
                        $filter: {
                            input: '$devis',
                            cond: { $eq: ['$$this.statut', 'accepte'] }
                        }
                    }
                }
            }
        },
        { $sort: { prix: -1 } },
        { $limit: limit }
    ]

    return await Annonce.aggregate(pipeline)
}