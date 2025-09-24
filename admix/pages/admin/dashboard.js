import { useState, useEffect } from 'react'
import {
    TrendingUp,
    TrendingDown,
    Package,
    Users,
    FileText,
    BarChart3,
    AlertCircle
} from 'lucide-react'

import { dashboardService } from '@/services'
import AdminLayout from '@/components/admin/Layout'

export default function AdminDashboard() {
    const [stats, setStats] = useState(null)
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)

                console.log('Chargement des données dashboard...')

                // Essayer de charger les stats avec un timeout
                const statsPromise = dashboardService.getStats().catch(err => {
                    console.error('Erreur stats:', err)
                    return { data: getDefaultStats() }
                })

                // Essayer de charger les activités avec un timeout  
                const activitiesPromise = dashboardService.getRecentActivities(10).catch(err => {
                    console.error('Erreur activités:', err)
                    return { data: [] }
                })

                const [statsRes, activitiesRes] = await Promise.all([
                    statsPromise,
                    activitiesPromise
                ])

                console.log('Données reçues:', { stats: statsRes.data, activities: activitiesRes.data })

                setStats(statsRes.data)
                setActivities(activitiesRes.data || [])

            } catch (error) {
                console.error('Erreur lors du chargement:', error)
                setError('Erreur lors du chargement des données')
                // Utiliser des données par défaut en cas d'erreur
                setStats(getDefaultStats())
                setActivities([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Données par défaut en cas d'erreur
    const getDefaultStats = () => ({
        overview: {
            totalAnnonces: 0,
            totalVendeurs: 0,
            totalDevis: 0,
            totalCategories: 0,
            performance: {
                annoncesCroissance: 0,
                devisCroissance: 0,
                recherchesCroissance: 0,
                tauxConversionDevis: 0
            }
        },
        annonces: {
            total: 0,
            parStatut: {
                active: 0,
                vendue: 0,
                suspendue: 0,
                brouillon: 0
            }
        }
    })

    if (loading) {
        return (
            <AdminLayout>
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                        <p className="mt-2 text-gray-600">Chargement des données...</p>
                    </div>

                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white overflow-hidden shadow rounded-lg h-32">
                                    <div className="p-5">
                                        <div className="animate-pulse flex space-x-4">
                                            <div className="rounded-md bg-gray-300 h-12 w-12"></div>
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                            <div>
                                <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
                                <p className="text-red-700 mt-1">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                >
                                    Recharger
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    const statCards = [
        {
            title: 'Annonces',
            value: stats?.overview?.totalAnnonces || 0,
            change: stats?.overview?.performance?.annoncesCroissance || 0,
            icon: Package,
            color: 'blue'
        },
        {
            title: 'Vendeurs',
            value: stats?.overview?.totalVendeurs || 0,
            change: 0,
            icon: Users,
            color: 'green'
        },
        {
            title: 'Devis',
            value: stats?.overview?.totalDevis || 0,
            change: stats?.overview?.performance?.devisCroissance || 0,
            icon: FileText,
            color: 'purple'
        },
        {
            title: 'Taux Conversion',
            value: `${stats?.overview?.performance?.tauxConversionDevis || 0}%`,
            change: 0,
            icon: BarChart3,
            color: 'yellow'
        }
    ]

    return (
        <AdminLayout>
            <div className="px-4 sm:px-6 lg:px-8">
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                    <p className="mt-2 text-gray-600">Vue d'ensemble de votre plateforme</p>
                </div>

                {/* Message si pas de données */}
                {(!stats?.overview?.totalAnnonces && !loading) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                        <p className="text-blue-800">
                            Aucune donnée disponible. Commencez par ajouter des catégories et des annonces.
                        </p>
                    </div>
                )}

                {/* Cartes statistiques */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {statCards.map((card, index) => (
                        <StatCard key={index} {...card} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Annonces par statut */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Annonces par statut</h3>
                        <div className="space-y-4">
                            <StatBar
                                label="Actives"
                                value={stats?.annonces?.parStatut?.active || 0}
                                total={stats?.annonces?.total || 1}
                                color="green"
                            />
                            <StatBar
                                label="Vendues"
                                value={stats?.annonces?.parStatut?.vendue || 0}
                                total={stats?.annonces?.total || 1}
                                color="purple"
                            />
                            <StatBar
                                label="Suspendues"
                                value={stats?.annonces?.parStatut?.suspendue || 0}
                                total={stats?.annonces?.total || 1}
                                color="yellow"
                            />
                            <StatBar
                                label="Brouillons"
                                value={stats?.annonces?.parStatut?.brouillon || 0}
                                total={stats?.annonces?.total || 1}
                                color="gray"
                            />
                        </div>
                    </div>

                    {/* Activités récentes */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Activités récentes</h3>
                        <div className="space-y-4">
                            {activities.length > 0 ? (
                                activities.slice(0, 5).map((activity, index) => (
                                    <ActivityItem key={index} activity={activity} />
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

// Composants identiques mais avec des vérifications supplémentaires
const StatCard = ({ title, value, change, icon: Icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-500 text-white',
        green: 'bg-green-500 text-white',
        purple: 'bg-purple-500 text-white',
        yellow: 'bg-yellow-500 text-white'
    }

    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={`p-3 rounded-md ${colorClasses[color]}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                                {change !== 0 && (
                                    <div className={`ml-2 flex items-baseline text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {change > 0 ? (
                                            <TrendingUp className="w-4 h-4 mr-1" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 mr-1" />
                                        )}
                                        {Math.abs(change)}%
                                    </div>
                                )}
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}

const StatBar = ({ label, value, total, color }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
    const colorClasses = {
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        yellow: 'bg-yellow-500',
        gray: 'bg-gray-500'
    }

    return (
        <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{label}</span>
                <span>{value} ({percentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${colorClasses[color]}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

const ActivityItem = ({ activity }) => {
    if (!activity) return null

    const iconMap = {
        car: Package,
        document: FileText,
        user: Users
    }

    const Icon = iconMap[activity.icon] || FileText

    return (
        <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.titre || 'Activité'}</p>
                <p className="text-sm text-gray-500">{activity.details || ''}</p>
                <p className="text-xs text-gray-400">
                    {activity.date ? new Date(activity.date).toLocaleDateString('fr-FR') : ''}
                </p>
            </div>
        </div>
    )
}