import { useState, useEffect } from 'react'
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    User,
    Building,
    MapPin,
    Phone,
    Mail,
    Star,
    Eye,
    EyeOff,
    X,
    Save,
    AlertCircle,
    Upload,
    Image as ImageIcon,
    CheckCircle,
    XCircle
} from 'lucide-react'

import { vendeurService, uploadService } from '@/services'
import AdminLayout from '@/components/admin/Layout'

export default function AdminVendeurs() {
    const [vendeurs, setVendeurs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activiteFilter, setActiviteFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingVendeur, setEditingVendeur] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchVendeurs()
    }, [])

    const fetchVendeurs = async () => {
        try {
            setLoading(true)
            const response = await vendeurService.getAll({
                search: searchTerm,
                activite: activiteFilter,
                sortBy: 'nom',
                sortOrder: 'asc'
            })
            setVendeurs(response.data || [])
        } catch (error) {
            console.error('Erreur lors du chargement des vendeurs:', error)
            setError('Erreur lors du chargement des vendeurs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchVendeurs()
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [searchTerm, activiteFilter])

    const handleCreate = () => {
        setEditingVendeur(null)
        setShowModal(true)
    }

    const handleEdit = (vendeur) => {
        setEditingVendeur(vendeur)
        setShowModal(true)
    }

    const handleDelete = async (vendeur) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${vendeur.nom}" ?`)) {
            return
        }

        try {
            // Supprimer les images Cloudinary si elles existent
            if (vendeur.logo?.public_id) {
                try {
                    await uploadService.deleteCloudinaryImage(vendeur.logo.public_id)
                } catch (error) {
                    console.log('Erreur lors de la suppression du logo:', error)
                }
            }

            if (vendeur.couverture?.public_id) {
                try {
                    await uploadService.deleteCloudinaryImage(vendeur.couverture.public_id)
                } catch (error) {
                    console.log('Erreur lors de la suppression de la couverture:', error)
                }
            }

            await vendeurService.delete(vendeur._id)
            fetchVendeurs()
            setError('')
        } catch (error) {
            setError(error.response?.data?.error || 'Erreur lors de la suppression')
        }
    }

    const handleToggleActivite = async (vendeur) => {
        try {
            await vendeurService.toggleActivite(vendeur._id)
            fetchVendeurs()
        } catch (error) {
            setError(error.response?.data?.error || 'Erreur lors du changement de statut')
        }
    }

    const handleModalClose = () => {
        setShowModal(false)
        setEditingVendeur(null)
    }

    const handleSaveSuccess = () => {
        fetchVendeurs()
        handleModalClose()
    }

    const filteredVendeurs = vendeurs.filter(vendeur => {
        const matchSearch = !searchTerm ||
            vendeur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendeur.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendeur.ville?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchActivite = activiteFilter === '' ||
            vendeur.activite.toString() === activiteFilter

        return matchSearch && matchActivite
    })

    const statsVendeurs = {
        total: vendeurs.length,
        actifs: vendeurs.filter(v => v.activite).length,
        inactifs: vendeurs.filter(v => !v.activite).length,
        avecLogo: vendeurs.filter(v => v.logo?.secure_url).length
    }

    return (
        <AdminLayout>
            <div className="px-4 sm:px-6 lg:px-8">
                {/* En-tête */}
                <div className="sm:flex sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Vendeurs</h1>
                        <p className="mt-2 text-gray-600">Gérez les vendeurs et leurs profils (logos et couvertures)</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nouveau vendeur</span>
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <User className="w-8 h-8 text-blue-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Total</p>
                                <p className="text-2xl font-semibold text-gray-900">{statsVendeurs.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Actifs</p>
                                <p className="text-2xl font-semibold text-gray-900">{statsVendeurs.actifs}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <XCircle className="w-8 h-8 text-red-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Inactifs</p>
                                <p className="text-2xl font-semibold text-gray-900">{statsVendeurs.inactifs}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <ImageIcon className="w-8 h-8 text-purple-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Avec logo</p>
                                <p className="text-2xl font-semibold text-gray-900">{statsVendeurs.avecLogo}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtres */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rechercher
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Nom, email ou ville..."
                                    className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Statut d'activité
                            </label>
                            <select
                                value={activiteFilter}
                                onChange={(e) => setActiviteFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="true">Actifs seulement</option>
                                <option value="false">Inactifs seulement</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <div className="bg-gray-50 rounded-lg p-3 w-full">
                                <p className="text-sm text-gray-600">
                                    {filteredVendeurs.length} vendeur{filteredVendeurs.length !== 1 ? 's' : ''} trouvé{filteredVendeurs.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            <p className="text-red-800">{error}</p>
                            <button
                                onClick={() => setError('')}
                                className="ml-auto text-red-600 hover:text-red-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Liste des vendeurs */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Chargement des vendeurs...</p>
                        </div>
                    ) : filteredVendeurs.length === 0 ? (
                        <div className="p-8 text-center">
                            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun vendeur trouvé</h3>
                            <p className="text-gray-600 mb-4">
                                {searchTerm || activiteFilter ? 'Aucun résultat pour vos critères de recherche' : 'Commencez par créer votre premier vendeur'}
                            </p>
                            <button
                                onClick={handleCreate}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Créer un vendeur
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vendeur
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Localisation
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Note
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Créé le
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredVendeurs.map((vendeur) => (
                                        <VendeurRow
                                            key={vendeur._id}
                                            vendeur={vendeur}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onToggleActivite={handleToggleActivite}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de création/édition */}
            {showModal && (
                <VendeurModal
                    vendeur={editingVendeur}
                    onClose={handleModalClose}
                    onSuccess={handleSaveSuccess}
                />
            )}
        </AdminLayout>
    )
}

// Composant pour une ligne de vendeur
const VendeurRow = ({ vendeur, onEdit, onDelete, onToggleActivite }) => {

    // Fonction pour afficher l'avatar/logo
    const renderAvatar = (logoData, nom) => {
        if (logoData?.secure_url) {
            return (
                <img
                    src={logoData.secure_url}
                    alt={`Logo ${nom}`}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                        e.target.style.display = 'none'
                    }}
                />
            )
        }

        // Avatar par défaut avec initiales
        const initiales = nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        return (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {initiales}
            </div>
        )
    }

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        {renderAvatar(vendeur.logo, vendeur.nom)}
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{vendeur.nom}</div>
                        {vendeur.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{vendeur.description}</div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="space-y-1">
                    {vendeur.email && (
                        <div className="flex items-center">
                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                            <span>{vendeur.email}</span>
                        </div>
                    )}
                    {vendeur.telephone && (
                        <div className="flex items-center">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            <span>{vendeur.telephone}</span>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {vendeur.ville ? (
                    <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{vendeur.ville}</span>
                        {vendeur.codePostal && <span className="text-gray-500 ml-1">({vendeur.codePostal})</span>}
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span>{vendeur.avisNote.toFixed(1)}</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <button
                    onClick={() => onToggleActivite(vendeur)}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${vendeur.activite
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                >
                    {vendeur.activite ? (
                        <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Actif
                        </>
                    ) : (
                        <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactif
                        </>
                    )}
                </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(vendeur.createdAt).toLocaleDateString('fr-FR')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                    onClick={() => onEdit(vendeur)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    title="Modifier"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(vendeur)}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                    title="Supprimer"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    )
}

// Modal de création/édition de vendeur
const VendeurModal = ({ vendeur, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        nom: vendeur?.nom || '',
        email: vendeur?.email || '',
        telephone: vendeur?.telephone || '',
        adresse: vendeur?.adresse || '',
        ville: vendeur?.ville || '',
        codePostal: vendeur?.codePostal || '',
        pays: vendeur?.pays || 'France',
        description: vendeur?.description || '',
        avisNote: vendeur?.avisNote || 0,
        activite: vendeur?.activite !== undefined ? vendeur.activite : true,
        logo: vendeur?.logo || null,
        couverture: vendeur?.couverture || null
    })
    const [loading, setLoading] = useState(false)
    const [uploadLoading, setUploadLoading] = useState({ logo: false, couverture: false })
    const [error, setError] = useState('')

    const isEditing = !!vendeur

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    // Gestion de l'upload d'images (logo ou couverture)
    const handleImageUpload = async (e, imageType) => {
        const file = e.target.files[0]
        if (!file) return

        // Vérifications côté client
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            setError(`Format de fichier non supporté pour ${imageType}. Utilisez PNG, JPG, GIF ou WebP.`)
            return
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB max
            setError(`Le fichier ${imageType} est trop volumineux (max 5MB)`)
            return
        }

        try {
            setUploadLoading(prev => ({ ...prev, [imageType]: true }))
            setError('')

            // Upload vers Cloudinary (avec remplacement automatique de l'ancienne)
            const response = await uploadService.uploadVendeurImage(
                file,
                imageType,
                formData[imageType]?.public_id // Ancien public_id pour suppression auto
            )

            if (response.success) {
                setFormData(prev => ({
                    ...prev,
                    [imageType]: {
                        public_id: response.data.public_id,
                        secure_url: response.data.secure_url,
                        width: response.data.width,
                        height: response.data.height,
                        format: response.data.format,
                        size: response.data.size
                    }
                }))
            }

        } catch (error) {
            setError(error.response?.data?.error || `Erreur lors de l'upload ${imageType}`)
        } finally {
            setUploadLoading(prev => ({ ...prev, [imageType]: false }))
        }
    }

    // Supprimer une image
    const handleRemoveImage = async (imageType) => {
        if (!formData[imageType]?.public_id) return

        try {
            await uploadService.deleteCloudinaryImage(formData[imageType].public_id)
            setFormData(prev => ({ ...prev, [imageType]: null }))
        } catch (error) {
            console.error(`Erreur lors de la suppression ${imageType}:`, error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isEditing) {
                await vendeurService.update(vendeur._id, formData)
            } else {
                await vendeurService.create(formData)
            }

            onSuccess()
        } catch (error) {
            setError(error.response?.data?.error || 'Erreur lors de la sauvegarde')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />

                <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                    <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <h3 className="text-lg font-medium text-gray-900">
                            {isEditing ? 'Modifier le vendeur' : 'Nouveau vendeur'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Images gérées via Cloudinary</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Informations de base */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Informations de base</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nom de l'entreprise *
                                    </label>
                                    <input
                                        type="text"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Transport Dupont"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="contact@transport-dupont.fr"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="01 23 45 67 89"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Note des avis
                                    </label>
                                    <input
                                        type="number"
                                        name="avisNote"
                                        value={formData.avisNote}
                                        onChange={handleChange}
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Description de l'entreprise..."
                                />
                            </div>
                        </div>

                        {/* Adresse */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Localisation</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adresse
                                </label>
                                <input
                                    type="text"
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="123 Rue de la République"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ville
                                    </label>
                                    <input
                                        type="text"
                                        name="ville"
                                        value={formData.ville}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Lyon"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Code postal
                                    </label>
                                    <input
                                        type="text"
                                        name="codePostal"
                                        value={formData.codePostal}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="69000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pays
                                    </label>
                                    <input
                                        type="text"
                                        name="pays"
                                        value={formData.pays}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="France"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Images */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Images (Cloudinary)</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Logo */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Logo de l'entreprise
                                    </label>

                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                        <input
                                            type="file"
                                            accept=".png,.jpg,.jpeg,.gif,.webp,image/*"
                                            onChange={(e) => handleImageUpload(e, 'logo')}
                                            className="hidden"
                                            id="logo-upload"
                                            disabled={uploadLoading.logo}
                                        />

                                        {formData.logo?.secure_url ? (
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={formData.logo.secure_url}
                                                    alt="Logo"
                                                    className="w-16 h-16 object-contain rounded border border-gray-200"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-600">Logo chargé</p>
                                                    <p className="text-xs text-gray-500">
                                                        {formData.logo.width}x{formData.logo.height} • {formData.logo.format?.toUpperCase()} • {Math.round(formData.logo.size / 1024)}KB
                                                    </p>
                                                    <div className="flex space-x-2 mt-2">
                                                        <label
                                                            htmlFor="logo-upload"
                                                            className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm"
                                                        >
                                                            {uploadLoading.logo ? 'Upload...' : 'Changer'}
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage('logo')}
                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                            disabled={uploadLoading.logo}
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <label
                                                htmlFor="logo-upload"
                                                className="cursor-pointer flex flex-col items-center"
                                            >
                                                {uploadLoading.logo ? (
                                                    <>
                                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                                                        <span className="text-sm text-gray-600">Upload du logo...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                        <span className="text-sm text-gray-600">
                                                            Cliquer pour uploader un logo
                                                        </span>
                                                        <span className="text-xs text-gray-500 mt-1">
                                                            PNG, JPG, GIF, WebP (max 5MB)
                                                        </span>
                                                    </>
                                                )}
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Couverture */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Image de couverture
                                    </label>

                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                        <input
                                            type="file"
                                            accept=".png,.jpg,.jpeg,.gif,.webp,image/*"
                                            onChange={(e) => handleImageUpload(e, 'couverture')}
                                            className="hidden"
                                            id="couverture-upload"
                                            disabled={uploadLoading.couverture}
                                        />

                                        {formData.couverture?.secure_url ? (
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={formData.couverture.secure_url}
                                                    alt="Couverture"
                                                    className="w-16 h-10 object-cover rounded border border-gray-200"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-600">Couverture chargée</p>
                                                    <p className="text-xs text-gray-500">
                                                        {formData.couverture.width}x{formData.couverture.height} • {formData.couverture.format?.toUpperCase()} • {Math.round(formData.couverture.size / 1024)}KB
                                                    </p>
                                                    <div className="flex space-x-2 mt-2">
                                                        <label
                                                            htmlFor="couverture-upload"
                                                            className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm"
                                                        >
                                                            {uploadLoading.couverture ? 'Upload...' : 'Changer'}
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage('couverture')}
                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                            disabled={uploadLoading.couverture}
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <label
                                                htmlFor="couverture-upload"
                                                className="cursor-pointer flex flex-col items-center"
                                            >
                                                {uploadLoading.couverture ? (
                                                    <>
                                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                                                        <span className="text-sm text-gray-600">Upload de la couverture...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                        <span className="text-sm text-gray-600">
                                                            Cliquer pour uploader une couverture
                                                        </span>
                                                        <span className="text-xs text-gray-500 mt-1">
                                                            PNG, JPG, GIF, WebP (max 5MB)
                                                        </span>
                                                    </>
                                                )}
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-blue-600">
                                ☁️ Images automatiquement optimisées et redimensionnées par Cloudinary
                            </p>
                        </div>

                        {/* Statut */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Statut</h4>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="activite"
                                    id="activite"
                                    checked={formData.activite}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="activite" className="ml-2 block text-sm text-gray-900">
                                    Vendeur actif
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">
                                Les vendeurs inactifs n'apparaîtront pas dans les recherches publiques
                            </p>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                disabled={loading || uploadLoading.logo || uploadLoading.couverture}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading || uploadLoading.logo || uploadLoading.couverture}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                <Save className="w-4 h-4" />
                                <span>{isEditing ? 'Modifier' : 'Créer'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
