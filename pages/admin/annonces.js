"use client"

import { useState, useEffect } from "react"
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Package,
    Eye,
    Copy,
    X,
    Save,
    AlertCircle,
    ImageIcon,
    MapPin,
    Calendar,
    Fuel,
    Gauge,
    Tag,
} from "lucide-react"

import { annonceService, categoryService, vendeurService, uploadService } from "@/services"
import AdminLayout from "@/components/admin/Layout"

export default function AdminAnnonces() {
    const [annonces, setAnnonces] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedStatut, setSelectedStatut] = useState("")
    const [selectedCategorie, setSelectedCategorie] = useState("")
    const [selectedVendeur, setSelectedVendeur] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [editingAnnonce, setEditingAnnonce] = useState(null)
    const [categories, setCategories] = useState([])
    const [vendeurs, setVendeurs] = useState([])
    const [error, setError] = useState("")
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    })

    useEffect(() => {
        fetchAnnonces()
        fetchCategories()
        fetchVendeurs()
    }, [])

    const fetchAnnonces = async () => {
        try {
            setLoading(true)
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                statut: selectedStatut,
                categorieId: selectedCategorie,
                vendeurId: selectedVendeur,
                sortBy: "createdAt",
                sortOrder: "desc",
            }

            // Remove empty params
            Object.keys(params).forEach((key) => {
                if (!params[key]) delete params[key]
            })

            const response = await annonceService.getAll(params)
            setAnnonces(response.data || [])
            setPagination(response.pagination || pagination)
        } catch (error) {
            console.error("Erreur lors du chargement des annonces:", error)
            setError("Erreur lors du chargement des annonces")
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAll({ limit: 100 })
            setCategories(response.data || [])
        } catch (error) {
            console.error("Erreur lors du chargement des catégories:", error)
        }
    }

    const fetchVendeurs = async () => {
        try {
            const response = await vendeurService.getAll({ limit: 100 })
            setVendeurs(response.data || [])
        } catch (error) {
            console.error("Erreur lors du chargement des vendeurs:", error)
        }
    }

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchAnnonces()
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [searchTerm, selectedStatut, selectedCategorie, selectedVendeur, pagination.page])

    const handleCreate = () => {
        setEditingAnnonce(null)
        setShowModal(true)
    }

    const handleEdit = (annonce) => {
        setEditingAnnonce(annonce)
        setShowModal(true)
    }

    const handleDelete = async (annonce) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${annonce.titre}" ?`)) {
            return
        }

        try {
            await annonceService.delete(annonce._id)
            fetchAnnonces()
            setError("")
        } catch (error) {
            setError(error.response?.data?.error || "Erreur lors de la suppression")
        }
    }

    const handleDuplicate = async (annonce) => {
        try {
            await annonceService.duplicate(annonce._id)
            fetchAnnonces()
            setError("")
        } catch (error) {
            setError(error.response?.data?.error || "Erreur lors de la duplication")
        }
    }

    const handleStatusChange = async (annonce, newStatut) => {
        try {
            await annonceService.updateStatut(annonce._id, newStatut)
            fetchAnnonces()
            setError("")
        } catch (error) {
            setError(error.response?.data?.error || "Erreur lors du changement de statut")
        }
    }

    const handleModalClose = () => {
        setShowModal(false)
        setEditingAnnonce(null)
    }

    const handleSaveSuccess = () => {
        fetchAnnonces()
        handleModalClose()
    }

    const handlePageChange = (newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }))
    }

    const getStatutColor = (statut) => {
        const colors = {
            active: "bg-green-100 text-green-800",
            vendue: "bg-blue-100 text-blue-800",
            suspendue: "bg-yellow-100 text-yellow-800",
            brouillon: "bg-gray-100 text-gray-800",
        }
        return colors[statut] || "bg-gray-100 text-gray-800"
    }

    const getStatutLabel = (statut) => {
        const labels = {
            active: "Active",
            vendue: "Vendue",
            suspendue: "Suspendue",
            brouillon: "Brouillon",
        }
        return labels[statut] || statut
    }

    return (
        <AdminLayout>
            <div className="px-4 sm:px-6 lg:px-8">
                {/* En-tête */}
                <div className="sm:flex sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Annonces</h1>
                        <p className="mt-2 text-gray-600">Gérez toutes les annonces de la plateforme</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nouvelle annonce</span>
                    </button>
                </div>

                {/* Filtres */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Titre, marque, modèle..."
                                    className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                            <select
                                value={selectedStatut}
                                onChange={(e) => setSelectedStatut(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="active">Active</option>
                                <option value="vendue">Vendue</option>
                                <option value="suspendue">Suspendue</option>
                                <option value="brouillon">Brouillon</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                            <select
                                value={selectedCategorie}
                                onChange={(e) => setSelectedCategorie(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Toutes les catégories</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Vendeur</label>
                            <select
                                value={selectedVendeur}
                                onChange={(e) => setSelectedVendeur(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Tous les vendeurs</option>
                                {vendeurs.map((vendeur) => (
                                    <option key={vendeur._id} value={vendeur._id}>
                                        {vendeur.nom}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="bg-gray-50 rounded-lg p-3 flex items-center space-x-4 text-sm text-gray-600">
                            <span>Total: {pagination.total}</span>
                            <span>•</span>
                            <span>
                                Page: {pagination.page}/{pagination.totalPages}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            <p className="text-red-800">{error}</p>
                            <button onClick={() => setError("")} className="ml-auto text-red-600 hover:text-red-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Liste des annonces */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Chargement des annonces...</p>
                        </div>
                    ) : annonces.length === 0 ? (
                        <div className="p-8 text-center">
                            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune annonce trouvée</h3>
                            <p className="text-gray-600 mb-4">
                                {searchTerm || selectedStatut || selectedCategorie || selectedVendeur
                                    ? "Aucun résultat pour vos critères de recherche"
                                    : "Commencez par créer votre première annonce"}
                            </p>
                            <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                Créer une annonce
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Annonce
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Détails
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vendeur
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stats
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {annonces.map((annonce) => (
                                            <AnnonceRow
                                                key={annonce._id}
                                                annonce={annonce}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onDuplicate={handleDuplicate}
                                                onStatusChange={handleStatusChange}
                                                getStatutColor={getStatutColor}
                                                getStatutLabel={getStatutLabel}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={!pagination.hasPrevious}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Précédent
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={!pagination.hasNext}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Suivant
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Affichage de <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>{" "}
                                                à{" "}
                                                <span className="font-medium">
                                                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                                                </span>{" "}
                                                sur <span className="font-medium">{pagination.total}</span> résultats
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                <button
                                                    onClick={() => handlePageChange(pagination.page - 1)}
                                                    disabled={!pagination.hasPrevious}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Précédent
                                                </button>
                                                <button
                                                    onClick={() => handlePageChange(pagination.page + 1)}
                                                    disabled={!pagination.hasNext}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Suivant
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal de création/édition */}
            {showModal && (
                <AnnonceModal
                    annonce={editingAnnonce}
                    categories={categories}
                    vendeurs={vendeurs}
                    onClose={handleModalClose}
                    onSuccess={handleSaveSuccess}
                />
            )}
        </AdminLayout>
    )
}

// Composant AnnonceRow
const AnnonceRow = ({ annonce, onEdit, onDelete, onDuplicate, onStatusChange, getStatutColor, getStatutLabel }) => {
    const formatPrice = (price, devise) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: devise || "EUR",
        }).format(price)
    }

    const renderPhoto = (photos) => {
        if (!photos || photos.length === 0) {
            return (
                <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
            )
        }

        return (
            <div className="w-16 h-12 rounded overflow-hidden">
                <img
                    src={photos[0] || "/placeholder.svg"}
                    alt="Photo annonce"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = "/placeholder-image.jpg"
                    }}
                />
            </div>
        )
    }

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                    {renderPhoto(annonce.photos)}
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{annonce.titre}</div>
                        <div className="text-sm text-gray-500">
                            {annonce.marque} {annonce.modele && `• ${annonce.modele}`}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center space-x-2 mt-1">
                            <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {annonce.annee}
                            </span>
                            <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {annonce.pays}
                            </span>
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                    <div className="font-medium text-green-600">{formatPrice(annonce.prix, annonce.devise)}</div>
                    <div className="text-xs text-gray-500 space-y-1 mt-1">
                        <div className="flex items-center">
                            <Fuel className="w-3 h-3 mr-1" />
                            {annonce.typeCarburant}
                        </div>
                        <div className="flex items-center">
                            <Tag className="w-3 h-3 mr-1" />
                            {annonce.etat}
                        </div>
                        {annonce.kilometrage && (
                            <div className="flex items-center">
                                <Gauge className="w-3 h-3 mr-1" />
                                {annonce.kilometrage.toLocaleString()} km
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{annonce.vendeurId?.nom || "N/A"}</div>
                <div className="text-xs text-gray-500">{annonce.vendeurId?.ville || ""}</div>
            </td>
            <td className="px-6 py-4">
                <select
                    value={annonce.statut}
                    onChange={(e) => onStatusChange(annonce, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full border-0 ${getStatutColor(annonce.statut)}`}
                >
                    <option value="active">Active</option>
                    <option value="vendue">Vendue</option>
                    <option value="suspendue">Suspendue</option>
                    <option value="brouillon">Brouillon</option>
                </select>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span>{annonce.stats?.vues || 0}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(annonce.createdAt).toLocaleDateString("fr-FR")}</div>
                </div>
            </td>
            <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                <button
                    onClick={() => onEdit(annonce)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    title="Modifier"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDuplicate(annonce)}
                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                    title="Dupliquer"
                >
                    <Copy className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(annonce)}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                    title="Supprimer"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    )
}

// Modal AnnonceModal (version complète avec photos Cloudinary et caractéristiques)
const AnnonceModal = ({ annonce, categories, vendeurs, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        titre: annonce?.titre || "",
        marque: annonce?.marque || "",
        modele: annonce?.modele || "",
        pays: annonce?.pays || "",
        etat: annonce?.etat || "occasion",
        prix: annonce?.prix || "",
        devise: annonce?.devise || "EUR",
        annee: annonce?.annee || new Date().getFullYear(),
        typeCarburant: annonce?.typeCarburant || "diesel",
        poids: annonce?.poids || "",
        hauteur: annonce?.hauteur || "",
        longueur: annonce?.longueur || "",
        largeur: annonce?.largeur || "",
        puissance: annonce?.puissance || "",
        kilometrage: annonce?.kilometrage || "",
        plusInfos: annonce?.plusInfos || "",
        categorieId: annonce?.categorieId?._id || "",
        vendeurId: annonce?.vendeurId?._id || "",
        statut: annonce?.statut || "active",
        photos: annonce?.photos || [],
        caracteristiques: annonce?.caracteristiques || [],
    })
    const [loading, setLoading] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [error, setError] = useState("")
    const [selectedFiles, setSelectedFiles] = useState([])

    const isEditing = !!annonce

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files)

        // Validation des fichiers
        const validFiles = files.filter((file) => {
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/avif"]
            const maxSize = 30 * 1024 * 1024

            if (!allowedTypes.includes(file.type)) {
                setError(`Format non supporté pour ${file.name}. Utilisez PNG, JPG, GIF, AVIF ou WebP.`)
                return false
            }

            if (file.size > maxSize) {
                setError(`${file.name} est trop volumineux (max 30MB)`)
                return false
            }

            return true
        })

        if (validFiles.length + formData.photos.length > 30) {
            setError("Maximum 30 photos autorisées")
            return
        }

        setSelectedFiles(validFiles)
        setError("")
    }

    const handlePhotoUpload = async () => {
        if (selectedFiles.length === 0) return

        try {
            setUploadLoading(true)
            setError("")

            // Test Cloudinary connection
            const testResult = await uploadService.testCloudinary()
            if (!testResult.data.connected) {
                throw new Error("Cloudinary non connecté")
            }

            // Upload images to Cloudinary
            const response = await uploadService.uploadAnnonceImages(selectedFiles)

            if (response.success) {
                // Add new photos to existing ones
                setFormData((prev) => ({
                    ...prev,
                    photos: [...prev.photos, ...response.data],
                }))
                setSelectedFiles([])

                // Reset file input
                const fileInput = document.getElementById("photo-upload")
                if (fileInput) fileInput.value = ""
            }
        } catch (error) {
            console.error("Erreur upload photos:", error)
            setError(error.response?.data?.error || error.message || "Erreur lors de l'upload des photos")
        } finally {
            setUploadLoading(false)
        }
    }

    const handleRemovePhoto = async (photoIndex) => {
        const photo = formData.photos[photoIndex]

        try {
            // If it's a Cloudinary image, delete it
            if (photo.public_id) {
                await uploadService.deleteCloudinaryImage(photo.public_id)
            }

            // Remove from state
            setFormData((prev) => ({
                ...prev,
                photos: prev.photos.filter((_, index) => index !== photoIndex),
            }))
        } catch (error) {
            console.error("Erreur suppression photo:", error)
        }
    }

    const addCaracteristique = () => {
        setFormData((prev) => ({
            ...prev,
            caracteristiques: [...prev.caracteristiques, { nom: "", valeur: "", unite: "" }],
        }))
    }

    const updateCaracteristique = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            caracteristiques: prev.caracteristiques.map((carac, i) => (i === index ? { ...carac, [field]: value } : carac)),
        }))
    }

    const removeCaracteristique = (index) => {
        setFormData((prev) => ({
            ...prev,
            caracteristiques: prev.caracteristiques.filter((_, i) => i !== index),
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const submitData = {
                ...formData,
                photos: formData.photos.map((photo) => (typeof photo === "string" ? photo : photo.secure_url)),
                caracteristiques: formData.caracteristiques.filter((c) => c.nom && c.valeur),
            }

            if (isEditing) {
                await annonceService.update(annonce._id, submitData)
            } else {
                await annonceService.create(submitData)
            }
            onSuccess()
        } catch (error) {
            setError(error.response?.data?.error || "Erreur lors de la sauvegarde")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />

                <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-y-auto">
                    <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <h3 className="text-lg font-medium text-gray-900">
                            {isEditing ? "Modifier l'annonce" : "Nouvelle annonce"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Photos gérées via Cloudinary</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Informations de base */}
                        <div className="space-y-4">
                            <h4 className="text-md font-medium text-gray-900">Informations de base</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                                    <input
                                        type="text"
                                        name="titre"
                                        value={formData.titre}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Marque *</label>
                                    <input
                                        type="text"
                                        name="marque"
                                        value={formData.marque}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Modèle</label>
                                    <input
                                        type="text"
                                        name="modele"
                                        value={formData.modele}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pays *</label>
                                    <input
                                        type="text"
                                        name="pays"
                                        value={formData.pays}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">État *</label>
                                    <select
                                        name="etat"
                                        value={formData.etat}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="neuf">Neuf</option>
                                        <option value="occasion">Occasion</option>
                                        <option value="reconditionne">Reconditionné</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Année *</label>
                                    <input
                                        type="number"
                                        name="annee"
                                        value={formData.annee}
                                        onChange={handleChange}
                                        required
                                        min="1900"
                                        max={new Date().getFullYear() + 1}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Prix *</label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="number"
                                            name="prix"
                                            value={formData.prix}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <select
                                            name="devise"
                                            value={formData.devise}
                                            onChange={handleChange}
                                            className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="EUR">EUR</option>
                                            <option value="USD">USD</option>
                                            <option value="GBP">GBP</option>
                                            <option value="CHF">CHF</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de carburant *</label>
                                    <select
                                        name="typeCarburant"
                                        value={formData.typeCarburant}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="diesel">Diesel</option>
                                        <option value="essence">Essence</option>
                                        <option value="electrique">Électrique</option>
                                        <option value="hybride">Hybride</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                                    <select
                                        name="categorieId"
                                        value={formData.categorieId}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Sélectionner une catégorie</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.slug}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendeur *</label>
                                    <select
                                        name="vendeurId"
                                        value={formData.vendeurId}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Sélectionner un vendeur</option>
                                        {vendeurs.map((vendeur) => (
                                            <option key={vendeur._id} value={vendeur._id}>
                                                {vendeur.nom}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                                    <select
                                        name="statut"
                                        value={formData.statut}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="active">Active</option>
                                        <option value="vendue">Vendue</option>
                                        <option value="suspendue">Suspendue</option>
                                        <option value="brouillon">Brouillon</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Caractéristiques techniques de base */}
                        <div className="space-y-4">
                            <h4 className="text-md font-medium text-gray-900">Caractéristiques techniques de base</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Kilométrage</label>
                                    <input
                                        type="number"
                                        name="kilometrage"
                                        value={formData.kilometrage}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Puissance (CV)</label>
                                    <input
                                        type="number"
                                        name="puissance"
                                        value={formData.puissance}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Poids (kg)</label>
                                    <input
                                        type="number"
                                        name="poids"
                                        value={formData.poids}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Longueur (cm)</label>
                                    <input
                                        type="number"
                                        name="longueur"
                                        value={formData.longueur}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Largeur (cm)</label>
                                    <input
                                        type="number"
                                        name="largeur"
                                        value={formData.largeur}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hauteur (cm)</label>
                                    <input
                                        type="number"
                                        name="hauteur"
                                        value={formData.hauteur}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-md font-medium text-gray-900">Caractéristiques supplémentaires</h4>
                                <button
                                    type="button"
                                    onClick={addCaracteristique}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Ajouter</span>
                                </button>
                            </div>

                            {formData.caracteristiques.length > 0 && (
                                <div className="space-y-3">
                                    {formData.caracteristiques.map((carac, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Nom (ex: Transmission)"
                                                    value={carac.nom}
                                                    onChange={(e) => updateCaracteristique(index, "nom", e.target.value)}
                                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Valeur (ex: Automatique)"
                                                    value={carac.valeur}
                                                    onChange={(e) => updateCaracteristique(index, "valeur", e.target.value)}
                                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Unité (facultatif)"
                                                    value={carac.unite}
                                                    onChange={(e) => updateCaracteristique(index, "unite", e.target.value)}
                                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeCaracteristique(index)}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Supprimer"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-gray-500">
                                Ajoutez des caractéristiques spécifiques comme la transmission, les options, l'équipement, etc.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-md font-medium text-gray-900">Photos (Cloudinary)</h4>

                            {/* Upload de nouvelles photos */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                <div className="text-center">
                                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-4">
                                        <label htmlFor="photo-upload" className="cursor-pointer">
                                            <span className="mt-2 block text-sm font-medium text-gray-900">Sélectionner des photos</span>
                                            <input
                                                id="photo-upload"
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handlePhotoSelect}
                                                className="sr-only"
                                                disabled={uploadLoading}
                                            />
                                        </label>
                                        <p className="mt-1 text-xs text-gray-500">
                                            PNG, JPG, GIF, WebP, AVIF jusqu'à 30MB chacune. Maximum 30 photos.
                                        </p>
                                    </div>
                                </div>

                                {/* Fichiers sélectionnés en attente d'upload */}
                                {selectedFiles.length > 0 && (
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-gray-700">
                                                {selectedFiles.length} fichier(s) sélectionné(s)
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handlePhotoUpload}
                                                disabled={uploadLoading}
                                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
                                            >
                                                {uploadLoading ? (
                                                    <>
                                                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                                        <span>Upload...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Uploader</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {selectedFiles.map((file, index) => (
                                                <div key={index} className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
                                                    <p className="truncate">{file.name}</p>
                                                    <p>{Math.round(file.size / 1024)}KB</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Photos existantes */}
                            {formData.photos.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-3">
                                        Photos actuelles ({formData.photos.length}/30)
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {formData.photos.map((photo, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={typeof photo === "string" ? photo : photo.secure_url}
                                                    alt={`Photo ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhoto(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Supprimer cette photo"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                {photo.original_filename && (
                                                    <p className="text-xs text-gray-500 mt-1 truncate">{photo.original_filename}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-blue-600">
                                ☁️ Photos automatiquement optimisées et redimensionnées par Cloudinary
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Informations supplémentaires</label>
                            <textarea
                                name="plusInfos"
                                value={formData.plusInfos}
                                onChange={handleChange}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Description détaillée, équipements, historique..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
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
                                {loading && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                <Save className="w-4 h-4" />
                                <span>{isEditing ? "Modifier" : "Créer"}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}