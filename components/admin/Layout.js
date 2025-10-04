import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
    LayoutDashboard,
    Package,
    Users,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Bell
} from 'lucide-react'

import { authService } from '@/services'

const AdminLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Vérifier d'abord si on a un token
                if (!authService.isAuthenticated()) {
                    console.log('Pas de token, redirection vers login')
                    router.push('/admin/login')
                    return
                }

                // Récupérer l'utilisateur du localStorage d'abord
                const cachedUser = authService.getCurrentUser()
                if (cachedUser) {
                    setUser(cachedUser)
                    setLoading(false)
                }

                // Vérifier le token en arrière-plan
                try {
                    const response = await authService.verifyToken()
                    if (response.success) {
                        setUser(response.user)
                    }
                } catch (error) {
                    console.log('Token invalide, utilisation des données cache')
                    // Garder l'utilisateur du cache si le serveur ne répond pas
                    if (!cachedUser) {
                        authService.logout()
                    }
                }

            } catch (error) {
                console.error('Erreur d\'authentification:', error)
                authService.logout()
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [router])

    const handleLogout = () => {
        authService.logout()
    }

    const navigation = [
        { name: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Annonces', href: '/admin/annonces', icon: Package },
        { name: 'Vendeurs', href: '/admin/vendeurs', icon: Users },
        { name: 'Catégories', href: '/admin/categories', icon: FileText },
        { name: 'Devis', href: '/admin/devis', icon: FileText },
        { name: 'Commandes', href: '/admin/orders', icon: BarChart3 },
        // { name: 'Paramètres', href: '/admin/parametres', icon: Settings },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Redirection vers la connexion...</p>
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar mobile */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)} />
                    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
                        <Sidebar navigation={navigation} closeSidebar={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Sidebar desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
                <Sidebar navigation={navigation} />
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
                                >
                                    <Menu className="h-6 w-6" />
                                </button>
                                <h1 className="ml-4 text-lg font-semibold text-gray-900">
                                    Administration
                                </h1>
                            </div>

                            <div className="flex items-center space-x-4">
                                <button className="p-2 text-gray-500 hover:text-gray-700">
                                    <Bell className="w-5 h-5" />
                                </button>
                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{user.username || 'Admin'}</p>
                                        <p className="text-xs text-gray-500">{user.role || 'admin'}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-gray-500 hover:text-red-600"
                                        title="Déconnexion"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="py-6">
                    {children}
                </main>
            </div>
        </div>
    )
}

const Sidebar = ({ navigation, closeSidebar }) => {
    const router = useRouter()

    return (
        <div className="flex flex-col w-full bg-white border-r border-gray-200">
            <div className="flex-shrink-0 px-4 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
                {closeSidebar && (
                    <button onClick={closeSidebar} className="lg:hidden">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                )}
            </div>

            <nav className="flex-1 px-2 py-4 space-y-2">
                {navigation.map((item) => {
                    const isActive = router.pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            onClick={closeSidebar}
                        >
                            <item.icon
                                className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                                    }`}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}

export default AdminLayout