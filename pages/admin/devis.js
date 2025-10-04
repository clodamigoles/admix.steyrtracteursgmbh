"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/components/admin/Layout"
import { devisService } from "@/services"
import { formatDate } from "@/lib/utils"

export default function AdminDevis() {
    const router = useRouter()
    const [devis, setDevis] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedDevis, setSelectedDevis] = useState(null)
    const [showReponseModal, setShowReponseModal] = useState(false)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [reponseForm, setReponseForm] = useState({
        contrat: "",
        iban: "",
        bic: "",
        montantAPayer: "",
        devise: "EUR",
    })
    const [uploadingContrat, setUploadingContrat] = useState(false)
    const [sendingReponse, setSendingReponse] = useState(false)

    // Filtres et pagination
    const [filters, setFilters] = useState({
        search: "",
        statut: "",
        page: 1,
        limit: 20,
    })
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        totalPages: 1,
        limit: 20,
        hasPrevious: false,
        hasNext: false,
    })

    useEffect(() => {
        loadDevis()
    }, [filters])

    const loadDevis = async () => {
        try {
            setLoading(true)
            const response = await devisService.getAll(filters)
            setDevis(response.data)
            setPagination(response.pagination)
        } catch (error) {
            console.error("Erreur lors du chargement des devis:", error)
            setError("Erreur lors du chargement des devis")
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: 1, // Reset page when filters change
        }))
    }

    const handlePageChange = (newPage) => {
        setFilters((prev) => ({ ...prev, page: newPage }))
    }

    const openReponseModal = (devisItem) => {
        setSelectedDevis(devisItem)
        setReponseForm({
            contrat: devisItem.reponseAdmin?.contrat || "",
            iban: devisItem.reponseAdmin?.iban || "",
            bic: devisItem.reponseAdmin?.bic || "",
            montantAPayer: devisItem.reponseAdmin?.montantAPayer || "",
            devise: devisItem.reponseAdmin?.devise || "EUR",
        })
        setShowReponseModal(true)
    }

    const openDetailsModal = (devisItem) => {
        setSelectedDevis(devisItem)
        setShowDetailsModal(true)
    }

    const closeReponseModal = () => {
        setShowReponseModal(false)
        setSelectedDevis(null)
        setReponseForm({
            contrat: "",
            iban: "",
            bic: "",
            montantAPayer: "",
            devise: "EUR",
        })
    }

    const closeDetailsModal = () => {
        setShowDetailsModal(false)
        setSelectedDevis(null)
    }

    const handleContratUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        try {
            setUploadingContrat(true)
            const response = await devisService.uploadContrat(file)
            setReponseForm((prev) => ({
                ...prev,
                contrat: response.data.url,
            }))
        } catch (error) {
            console.error("Erreur lors de l'upload du contrat:", error)
            alert("Erreur lors de l'upload du contrat")
        } finally {
            setUploadingContrat(false)
        }
    }

    const handleSubmitReponse = async (e) => {
        e.preventDefault()

        if (!reponseForm.contrat || !reponseForm.iban || !reponseForm.bic || !reponseForm.montantAPayer) {
            alert("Tous les champs sont requis")
            return
        }

        try {
            setSendingReponse(true)
            await devisService.repondre(selectedDevis._id, reponseForm)
            alert("Réponse envoyée avec succès au client")
            closeReponseModal()
            loadDevis() // Recharger la liste
        } catch (error) {
            console.error("Erreur lors de l'envoi de la réponse:", error)
            alert("Erreur lors de l'envoi de la réponse")
        } finally {
            setSendingReponse(false)
        }
    }

    const getStatutBadge = (statut) => {
        const badges = {
            nouveau: "bg-blue-100 text-blue-800",
            en_cours: "bg-yellow-100 text-yellow-800",
            envoye: "bg-purple-100 text-purple-800",
            accepte: "bg-green-100 text-green-800",
            refuse: "bg-red-100 text-red-800",
            expire: "bg-gray-100 text-gray-800",
        }

        const labels = {
            nouveau: "Nouveau",
            en_cours: "En cours",
            envoye: "Envoyé",
            accepte: "Accepté",
            refuse: "Refusé",
            expire: "Expiré",
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[statut] || badges.nouveau}`}>
                {labels[statut] || statut}
            </span>
        )
    }

    if (loading && devis.length === 0) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestion des Devis</h1>
                        <p className="text-gray-600">Gérez les demandes de devis des clients</p>
                    </div>
                </div>

                {/* Filtres */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                            <input
                                type="text"
                                placeholder="Nom, email, téléphone..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                            <select
                                value={filters.statut}
                                onChange={(e) => handleFilterChange("statut", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="nouveau">Nouveau</option>
                                <option value="en_cours">En cours</option>
                                <option value="envoye">Envoyé</option>
                                <option value="accepte">Accepté</option>
                                <option value="refuse">Refusé</option>
                                <option value="expire">Expiré</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-blue-600">{pagination.total || 0}</div>
                        <div className="text-sm text-gray-600">Total devis</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-yellow-600">
                            {devis.filter((d) => d.statut === "nouveau").length}
                        </div>
                        <div className="text-sm text-gray-600">Nouveaux</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-purple-600">
                            {devis.filter((d) => d.statut === "envoye").length}
                        </div>
                        <div className="text-sm text-gray-600">Envoyés</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-green-600">
                            {devis.filter((d) => d.statut === "accepte").length}
                        </div>
                        <div className="text-sm text-gray-600">Acceptés</div>
                    </div>
                </div>

                {/* Tableau des devis */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Annonce
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {devis.map((devisItem) => (
                                    <tr key={devisItem._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {devisItem.prenom} {devisItem.nom}
                                                </div>
                                                <div className="text-sm text-gray-500">{devisItem.email}</div>
                                                <div className="text-sm text-gray-500">{devisItem.telephone}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {devisItem.annonceId?.titre || devisItem.annonceTitre}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {devisItem.annonceId?.marque} {devisItem.annonceId?.modele}
                                                </div>
                                                <a
                                                    href={`/ads/${devisItem.annonceId?._id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    Voir l'annonce →
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getStatutBadge(devisItem.statut)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(devisItem.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => openReponseModal(devisItem)} className="text-blue-600 hover:text-blue-900">
                                                {devisItem.statut === "envoye" ? "Modifier réponse" : "Répondre"}
                                            </button>
                                            <button
                                                onClick={() => openDetailsModal(devisItem)}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                Détails
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
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
                                        Affichage de <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> à{" "}
                                        <span className="font-medium">
                                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                                        </span>{" "}
                                        sur <span className="font-medium">{pagination.total}</span> résultats
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.page
                                                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {showDetailsModal && selectedDevis && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Détails du devis - {selectedDevis.prenom} {selectedDevis.nom}
                                    </h3>
                                    <button onClick={closeDetailsModal} className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Informations client */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-3">Informations client</h4>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="text-gray-600">Nom :</span>{" "}
                                                <span className="font-medium">
                                                    {selectedDevis.prenom} {selectedDevis.nom}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Email :</span>{" "}
                                                <span className="font-medium">{selectedDevis.email}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Téléphone :</span>{" "}
                                                <span className="font-medium">{selectedDevis.telephone}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Adresse :</span>{" "}
                                                <span className="font-medium">
                                                    {selectedDevis.numeroRue} {selectedDevis.rue}, {selectedDevis.codePostal}{" "}
                                                    {selectedDevis.ville}
                                                </span>
                                            </div>
                                            {selectedDevis.canton && (
                                                <div>
                                                    <span className="text-gray-600">Canton :</span>{" "}
                                                    <span className="font-medium">{selectedDevis.canton}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-gray-600">Pays :</span>{" "}
                                                <span className="font-medium">{selectedDevis.pays}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informations devis */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-3">Informations devis</h4>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="text-gray-600">Annonce :</span>{" "}
                                                <span className="font-medium">
                                                    {selectedDevis.annonceId?.titre || selectedDevis.annonceTitre}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Statut :</span> {getStatutBadge(selectedDevis.statut)}
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Date demande :</span>{" "}
                                                <span className="font-medium">{formatDate(selectedDevis.createdAt)}</span>
                                            </div>
                                            {selectedDevis.reponseAdmin?.dateReponse && (
                                                <div>
                                                    <span className="text-gray-600">Date réponse :</span>{" "}
                                                    <span className="font-medium">{formatDate(selectedDevis.reponseAdmin.dateReponse)}</span>
                                                </div>
                                            )}
                                            {selectedDevis.reponseClient?.dateAcceptation && (
                                                <div>
                                                    <span className="text-gray-600">Date acceptation :</span>{" "}
                                                    <span className="font-medium">{formatDate(selectedDevis.reponseClient.dateAcceptation)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Réponse admin (contrat envoyé) */}
                                    {selectedDevis.reponseAdmin && selectedDevis.reponseAdmin.contrat && (
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-3">Contrat envoyé au client</h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">Contrat PDF</span>
                                                    <a
                                                        href={selectedDevis.reponseAdmin.contrat.secure_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                            />
                                                        </svg>
                                                        Télécharger
                                                    </a>
                                                </div>
                                                <div className="text-sm">
                                                    <div>
                                                        <span className="text-gray-600">IBAN :</span>{" "}
                                                        <span className="font-medium">{selectedDevis.reponseAdmin.iban}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">BIC :</span>{" "}
                                                        <span className="font-medium">{selectedDevis.reponseAdmin.bic}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Montant :</span>{" "}
                                                        <span className="font-medium">
                                                            {selectedDevis.reponseAdmin.montantAPayer} {selectedDevis.reponseAdmin.devise}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents client (contrat signé et récipissé) */}
                                    {selectedDevis.reponseClient && selectedDevis.reponseClient.documentsUploades && (
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-3">Documents client</h4>
                                            <div className="space-y-3">
                                                {/* Contrat signé */}
                                                {selectedDevis.reponseClient.documentsUploades.contratSigne && (
                                                    <div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">Contrat signé</span>
                                                            <a
                                                                href={selectedDevis.reponseClient.documentsUploades.contratSigne.secure_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                                Télécharger
                                                            </a>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Uploadé le{" "}
                                                            {formatDate(selectedDevis.reponseClient.documentsUploades.contratSigne.uploaded_at)}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Récipissé de virement */}
                                                {selectedDevis.reponseClient.documentsUploades.recuVirement && (
                                                    <div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">Récipissé de virement</span>
                                                            <a
                                                                href={selectedDevis.reponseClient.documentsUploades.recuVirement.secure_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                                Télécharger
                                                            </a>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Uploadé le{" "}
                                                            {formatDate(selectedDevis.reponseClient.documentsUploades.recuVirement.uploaded_at)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Suivi de commande */}
                                    {selectedDevis.suiviCommande &&
                                        selectedDevis.suiviCommande.etapes &&
                                        selectedDevis.suiviCommande.etapes.length > 0 && (
                                            <div className="md:col-span-2 bg-purple-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-3">Suivi de la commande</h4>
                                                <div className="mb-3">
                                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                        <span>Progression</span>
                                                        <span>{selectedDevis.suiviCommande.progression}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-purple-600 h-2 rounded-full"
                                                            style={{ width: `${selectedDevis.suiviCommande.progression}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {selectedDevis.suiviCommande.etapes
                                                        .sort((a, b) => a.ordre - b.ordre)
                                                        .map((etape, index) => (
                                                            <div key={index} className="flex items-center space-x-3">
                                                                <div
                                                                    className={`w-3 h-3 rounded-full ${etape.statut === "termine"
                                                                            ? "bg-green-500"
                                                                            : etape.statut === "en_cours"
                                                                                ? "bg-blue-500"
                                                                                : "bg-gray-300"
                                                                        }`}
                                                                ></div>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-medium">{etape.nom}</div>
                                                                    {etape.description && (
                                                                        <div className="text-xs text-gray-600">{etape.description}</div>
                                                                    )}
                                                                    {etape.dateDebut && (
                                                                        <div className="text-xs text-gray-500">
                                                                            Début: {formatDate(etape.dateDebut)}
                                                                            {etape.dateFin && ` - Fin: ${formatDate(etape.dateFin)}`}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span
                                                                    className={`px-2 py-1 rounded-full text-xs ${etape.statut === "termine"
                                                                            ? "bg-green-100 text-green-800"
                                                                            : etape.statut === "en_cours"
                                                                                ? "bg-blue-100 text-blue-800"
                                                                                : "bg-gray-100 text-gray-800"
                                                                        }`}
                                                                >
                                                                    {etape.statut === "termine"
                                                                        ? "Terminé"
                                                                        : etape.statut === "en_cours"
                                                                            ? "En cours"
                                                                            : "En attente"}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                                {selectedDevis.suiviCommande.dateEstimeeLivraison && (
                                                    <div className="mt-3 text-sm">
                                                        <span className="text-gray-600">Livraison estimée :</span>
                                                        <span className="font-medium">
                                                            {" "}
                                                            {formatDate(selectedDevis.suiviCommande.dateEstimeeLivraison)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    {/* Messages */}
                                    <div className="md:col-span-2 space-y-4">
                                        {selectedDevis.message && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-2">Message initial du client</h4>
                                                <p className="text-sm text-gray-700">{selectedDevis.message}</p>
                                            </div>
                                        )}

                                        {selectedDevis.reponseClient?.commentaireClient && (
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-2">Commentaire du client</h4>
                                                <p className="text-sm text-gray-700">{selectedDevis.reponseClient.commentaireClient}</p>
                                            </div>
                                        )}

                                        {selectedDevis.reponseAdmin?.noteAdmin && (
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-2">Note admin</h4>
                                                <p className="text-sm text-gray-700">{selectedDevis.reponseAdmin.noteAdmin}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={closeDetailsModal}
                                        className="px-4 py-2 bg-gray-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-700"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de réponse */}
                {showReponseModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Répondre au devis de {selectedDevis?.prenom} {selectedDevis?.nom}
                                    </h3>
                                    <button onClick={closeReponseModal} className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Informations du devis */}
                                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                    <h4 className="font-medium text-gray-900 mb-2">Détails de la demande</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Annonce :</span>
                                            <div className="font-medium">{selectedDevis?.annonceId?.titre || selectedDevis.annonceTitre}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Client :</span>
                                            <div className="font-medium">
                                                {selectedDevis?.prenom} {selectedDevis?.nom}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Email :</span>
                                            <div className="font-medium">{selectedDevis?.email}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Téléphone :</span>
                                            <div className="font-medium">{selectedDevis?.telephone}</div>
                                        </div>
                                    </div>
                                    {selectedDevis?.message && (
                                        <div className="mt-3">
                                            <span className="text-gray-600">Message :</span>
                                            <div className="font-medium">{selectedDevis.message}</div>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleSubmitReponse} className="space-y-4">
                                    {/* Upload contrat */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Contrat (PDF) *</label>
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleContratUpload}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            {uploadingContrat && <div className="text-sm text-blue-600">Upload en cours...</div>}
                                        </div>
                                        {reponseForm.contrat && (
                                            <div className="mt-2 flex items-center space-x-4">
                                                <span className="text-sm text-green-600">✓ Contrat uploadé</span>
                                                <a
                                                    href={reponseForm.contrat}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                    Télécharger
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* IBAN */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">IBAN *</label>
                                        <input
                                            type="text"
                                            value={reponseForm.iban}
                                            onChange={(e) => setReponseForm((prev) => ({ ...prev, iban: e.target.value }))}
                                            placeholder="FR76 1234 5678 9012 3456 7890 123"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    {/* BIC */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">BIC *</label>
                                        <input
                                            type="text"
                                            value={reponseForm.bic}
                                            onChange={(e) => setReponseForm((prev) => ({ ...prev, bic: e.target.value }))}
                                            placeholder="BNPAFRPP"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    {/* Montant */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Montant à payer *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={reponseForm.montantAPayer}
                                                onChange={(e) => setReponseForm((prev) => ({ ...prev, montantAPayer: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
                                            <select
                                                value={reponseForm.devise}
                                                onChange={(e) => setReponseForm((prev) => ({ ...prev, devise: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="EUR">EUR</option>
                                                <option value="USD">USD</option>
                                                <option value="GBP">GBP</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Boutons */}
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeReponseModal}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={sendingReponse}
                                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {sendingReponse ? "Envoi en cours..." : "Envoyer la réponse"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}