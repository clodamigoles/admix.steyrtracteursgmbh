import { useState, useEffect } from 'react'
import {
    Plus,
    Edit,
    Trash2,
    Search,
    FolderTree,
    Folder,
    FileText,
    ChevronRight,
    X,
    Save,
    AlertCircle,
    Upload,
    ImageIcon
} from 'lucide-react'

import { categoryService, uploadService } from '@/services'
import AdminLayout from '@/components/admin/Layout'

export default function AdminCategories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedNiveau, setSelectedNiveau] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [parentCategories, setParentCategories] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        fetchCategories()
        fetchParentCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const response = await categoryService.getAll({
                search: searchTerm,
                niveau: selectedNiveau,
                sortBy: 'niveau',
                sortOrder: 'asc'
            })
            setCategories(response.data || [])
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error)
            setError('Erreur lors du chargement des catégories')
        } finally {
            setLoading(false)
        }
    }

    const fetchParentCategories = async () => {
        try {
            const response = await categoryService.getAll({ niveau: '1,2' })
            setParentCategories(response.data || [])
        } catch (error) {
            console.error('Erreur lors du chargement des catégories parentes:', error)
        }
    }

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchCategories()
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [searchTerm, selectedNiveau])

    const handleCreate = () => {
        setEditingCategory(null)
        setShowModal(true)
    }

    const handleEdit = (category) => {
        setEditingCategory(category)
        setShowModal(true)
    }

    const handleDelete = async (category) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${category.nom}" ?`)) {
            return
        }

        try {
            // Supprimer l'image Cloudinary si elle existe
            if (category.icon?.public_id) {
                try {
                    await uploadService.deleteCloudinaryImage(category.icon.public_id)
                } catch (error) {
                    console.log('Erreur lors de la suppression de l\'image:', error)
                }
            }

            await categoryService.delete(category._id)
            fetchCategories()
            setError('')
        } catch (error) {
            setError(error.response?.data?.error || 'Erreur lors de la suppression')
        }
    }

    const handleModalClose = () => {
        setShowModal(false)
        setEditingCategory(null)
    }

    const handleSaveSuccess = () => {
        fetchCategories()
        fetchParentCategories()
        handleModalClose()
    }

    const filteredCategories = categories.filter(category => {
        const matchSearch = !searchTerm ||
            category.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.description?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchNiveau = !selectedNiveau || category.niveau.toString() === selectedNiveau

        return matchSearch && matchNiveau
    })

    return (
        <AdminLayout>
            <div className="px-4 sm:px-6 lg:px-8">
                {/* En-tête */}
                <div className="sm:flex sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
                        <p className="mt-2 text-gray-600">Gérez la hiérarchie des catégories avec images (Cloudinary)</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nouvelle catégorie</span>
                    </button>
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
                                    placeholder="Nom ou description..."
                                    className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Niveau
                            </label>
                            <select
                                value={selectedNiveau}
                                onChange={(e) => setSelectedNiveau(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Tous les niveaux</option>
                                <option value="1">Catégories mères</option>
                                <option value="2">Sous-catégories</option>
                                <option value="3">Sous-sous-catégories</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <div className="bg-gray-50 rounded-lg p-3 flex items-center space-x-4 text-sm text-gray-600">
                                <span>Total: {filteredCategories.length}</span>
                                <span>•</span>
                                <span>Images: {filteredCategories.filter(c => c.icon?.secure_url).length}</span>
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

                {/* Liste des catégories */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Chargement des catégories...</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-8 text-center">
                            <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune catégorie trouvée</h3>
                            <p className="text-gray-600 mb-4">
                                {searchTerm || selectedNiveau ? 'Aucun résultat pour vos critères de recherche' : 'Commencez par créer votre première catégorie'}
                            </p>
                            <button
                                onClick={handleCreate}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Créer une catégorie
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Catégorie
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Niveau
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Parent
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Slug
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
                                    {filteredCategories.map((category) => (
                                        <CategoryRow
                                            key={category._id}
                                            category={category}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
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
                <CategoryModal
                    category={editingCategory}
                    parentCategories={parentCategories}
                    onClose={handleModalClose}
                    onSuccess={handleSaveSuccess}
                />
            )}
        </AdminLayout>
    )
}

// Composant CategoryRow mis à jour pour Cloudinary
const CategoryRow = ({ category, onEdit, onDelete }) => {
    const IconComponent = category.niveau === 1 ? FolderTree : category.niveau === 2 ? Folder : FileText

    const getNiveauColor = (niveau) => {
        const colors = {
            1: 'bg-blue-100 text-blue-800',
            2: 'bg-green-100 text-green-800',
            3: 'bg-purple-100 text-purple-800'
        }
        return colors[niveau] || 'bg-gray-100 text-gray-800'
    }

    const getNiveauLabel = (niveau) => {
        const labels = { 1: 'Mère', 2: 'Fils', 3: 'Petit-fils' }
        return labels[niveau] || niveau
    }

    // Fonction pour afficher l'image Cloudinary
    const renderIcon = (iconData) => {
        if (!iconData?.secure_url) return null

        return (
            <div className="w-8 h-8 flex-shrink-0">
                <img
                    src={iconData.secure_url}
                    alt="Icône"
                    className="w-full h-full object-contain rounded border border-gray-200"
                    onError={(e) => {
                        e.target.style.display = 'none'
                    }}
                />
            </div>
        )
    }

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="ml-3">
                        <div className="flex items-center space-x-3">
                            {category.icon && renderIcon(category.icon)}
                            <div>
                                <div className="text-sm font-medium text-gray-900">{category.nom}</div>
                                {category.description && (
                                    <div className="text-sm text-gray-500 truncate max-w-xs">{category.description}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getNiveauColor(category.niveau)}`}>
                    {getNiveauLabel(category.niveau)}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {category.parentId ? (
                    <div className="flex items-center space-x-1 text-gray-600">
                        <ChevronRight className="w-4 h-4" />
                        <span>{category.parentId.nom}</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-800">{category.slug}</code>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(category.createdAt).toLocaleDateString('fr-FR')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                    onClick={() => onEdit(category)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    title="Modifier"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(category)}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                    title="Supprimer"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    )
}

// Modal CategoryModal mise à jour pour Cloudinary
const CategoryModal = ({ category, parentCategories, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        nom: category?.nom || '',
        slug: category?.slug || '',
        description: category?.description || '',
        icon: category?.icon || null,
        parentId: category?.parentId?._id || ''
    })
    const [loading, setLoading] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [error, setError] = useState('')

    const isEditing = !!category

    // Auto-génération du slug
    useEffect(() => {
        if (formData.nom && !isEditing) {
            const slug = formData.nom
                .toLowerCase()
                .replace(/[àáâãäå]/g, 'a')
                .replace(/[èéêë]/g, 'e')
                .replace(/[ìíîï]/g, 'i')
                .replace(/[òóôõö]/g, 'o')
                .replace(/[ùúûü]/g, 'u')
                .replace(/[ç]/g, 'c')
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')

            setFormData(prev => ({ ...prev, slug }))
        }
    }, [formData.nom, isEditing])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Gestion de l'upload Cloudinary
    const handleIconUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Vérifications côté client
        const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            setError('Format de fichier non supporté. Utilisez SVG, PNG, JPG, GIF ou WebP.')
            return
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB max
            setError('Le fichier est trop volumineux (max 5MB)')
            return
        }

        try {
            setUploadLoading(true)
            setError('')

            // Upload vers Cloudinary (avec remplacement automatique de l'ancienne)
            const response = await uploadService.uploadCategoryIcon(
                file,
                formData.icon?.public_id // Ancien public_id pour suppression auto
            )

            if (response.success) {
                setFormData(prev => ({
                    ...prev,
                    icon: {
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
            setError(error.response?.data?.error || 'Erreur lors de l\'upload')
        } finally {
            setUploadLoading(false)
        }
    }

    // Supprimer l'icône Cloudinary
    const handleRemoveIcon = async () => {
        if (!formData.icon?.public_id) return

        try {
            await uploadService.deleteCloudinaryImage(formData.icon.public_id)
            setFormData(prev => ({ ...prev, icon: null }))
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const payload = {
                ...formData,
                parentId: formData.parentId || null
            }

            if (isEditing) {
                await categoryService.update(category._id, payload)
            } else {
                await categoryService.create(payload)
            }

            onSuccess()
        } catch (error) {
            setError(error.response?.data?.error || 'Erreur lors de la sauvegarde')
        } finally {
            setLoading(false)
        }
    }

    // Filtrer les catégories parentes selon les règles métier
    const getAvailableParents = () => {
        if (isEditing && category.niveau === 1) {
            return []
        }

        return parentCategories.filter(parent => {
            if (isEditing && parent._id === category._id) {
                return false
            }

            if (isEditing && category.niveau <= parent.niveau) {
                return false
            }

            return parent.niveau < 3
        })
    }

    const availableParents = getAvailableParents()

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />

                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            {isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Images gérées via Cloudinary</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom *
                            </label>
                            <input
                                type="text"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nom de la catégorie"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Slug *
                            </label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="url-friendly-slug"
                            />
                            <p className="text-xs text-gray-500 mt-1">URL conviviale, générée automatiquement</p>
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
                                placeholder="Description de la catégorie"
                            />
                        </div>

                        {/* Zone d'upload Cloudinary */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Icône (Cloudinary)
                            </label>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                <input
                                    type="file"
                                    accept=".svg,.png,.jpg,.jpeg,.gif,.webp,image/*"
                                    onChange={handleIconUpload}
                                    className="hidden"
                                    id="icon-upload"
                                    disabled={uploadLoading}
                                />

                                {formData.icon?.secure_url ? (
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={formData.icon.secure_url}
                                            alt="Icône"
                                            className="w-12 h-12 object-contain rounded border border-gray-200"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600">Image Cloudinary</p>
                                            <p className="text-xs text-gray-500">
                                                {formData.icon.width}x{formData.icon.height} • {formData.icon.format?.toUpperCase()} • {Math.round(formData.icon.size / 1024)}KB
                                            </p>
                                            <div className="flex space-x-2 mt-2">
                                                <label
                                                    htmlFor="icon-upload"
                                                    className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    {uploadLoading ? 'Upload...' : 'Changer'}
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveIcon}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                    disabled={uploadLoading}
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="icon-upload"
                                        className="cursor-pointer flex flex-col items-center"
                                    >
                                        {uploadLoading ? (
                                            <>
                                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                                                <span className="text-sm text-gray-600">Upload vers Cloudinary...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-600">
                                                    Cliquer pour uploader vers Cloudinary
                                                </span>
                                                <span className="text-xs text-gray-500 mt-1">
                                                    SVG, PNG, JPG, GIF, WebP (max 5MB)
                                                </span>
                                            </>
                                        )}
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                ☁️ Images automatiquement optimisées et redimensionnées par Cloudinary
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Catégorie parent
                            </label>
                            <select
                                name="parentId"
                                value={formData.parentId}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Aucun parent (catégorie mère)</option>
                                {availableParents.map(parent => (
                                    <option key={parent._id} value={parent._id}>
                                        {parent.niveau === 1 ? '📁' : '📂'} {parent.slug}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Laissez vide pour une catégorie mère
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                disabled={loading || uploadLoading}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading || uploadLoading}
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