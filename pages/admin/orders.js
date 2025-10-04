"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/components/admin/Layout"
import { ordersService } from "@/services"
import { formatDate } from "@/lib/utils"

export default function AdminOrders() {
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [statusForm, setStatusForm] = useState({
        statut: "",
        note: "",
    })
    const [updatingStatus, setUpdatingStatus] = useState(false)

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
        loadOrders()
    }, [filters])

    const loadOrders = async () => {
        try {
            setLoading(true)
            const response = await ordersService.getAll(filters)
            setOrders(response.data)
            setPagination(response.pagination)
        } catch (error) {
            console.error("Erreur lors du chargement des commandes:", error)
            setError("Erreur lors du chargement des commandes")
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

    const openDetailsModal = (orderItem) => {
        setSelectedOrder(orderItem)
        setShowDetailsModal(true)
    }

    const openStatusModal = (orderItem) => {
        setSelectedOrder(orderItem)
        setStatusForm({
            statut: orderItem.statut,
            note: "",
        })
        setShowStatusModal(true)
    }

    const closeDetailsModal = () => {
        setShowDetailsModal(false)
        setSelectedOrder(null)
    }

    const closeStatusModal = () => {
        setShowStatusModal(false)
        setSelectedOrder(null)
        setStatusForm({
            statut: "",
            note: "",
        })
    }

    const handleSubmitStatus = async (e) => {
        e.preventDefault()

        if (!statusForm.statut) {
            alert("Le statut est requis")
            return
        }

        try {
            setUpdatingStatus(true)
            await ordersService.updateStatut(selectedOrder._id, statusForm.statut, statusForm.note)
            alert("Statut mis à jour avec succès")
            closeStatusModal()
            loadOrders() // Recharger la liste
        } catch (error) {
            console.error("Erreur lors de la mise à jour du statut:", error)
            alert("Erreur lors de la mise à jour du statut")
        } finally {
            setUpdatingStatus(false)
        }
    }

    const getStatutBadge = (statut) => {
        const badges = {
            en_attente: "bg-yellow-100 text-yellow-800",
            en_cours: "bg-blue-100 text-blue-800",
            termine: "bg-green-100 text-green-800",
            annule: "bg-red-100 text-red-800",
        }

        const labels = {
            en_attente: "En attente",
            en_cours: "En cours",
            termine: "Terminé",
            annule: "Annulé",
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[statut] || badges.en_attente}`}>
                {labels[statut] || statut}
            </span>
        )
    }

    if (loading && orders.length === 0) {
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
                        <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
                        <p className="text-gray-600">Gérez les commandes des clients</p>
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
                                <option value="en_attente">En attente</option>
                                <option value="en_cours">En cours</option>
                                <option value="termine">Terminé</option>
                                <option value="annule">Annulé</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-blue-600">{pagination.total || 0}</div>
                        <div className="text-sm text-gray-600">Total commandes</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-yellow-600">
                            {orders.filter((o) => o.statut === "en_attente").length}
                        </div>
                        <div className="text-sm text-gray-600">En attente</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-blue-600">
                            {orders.filter((o) => o.statut === "en_cours").length}
                        </div>
                        <div className="text-sm text-gray-600">En cours</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-green-600">
                            {orders.filter((o) => o.statut === "termine").length}
                        </div>
                        <div className="text-sm text-gray-600">Terminées</div>
                    </div>
                </div>

                {/* Tableau des commandes */}
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
                                        Montant
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
                                {orders.map((orderItem) => (
                                    <tr key={orderItem._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {orderItem.prenom} {orderItem.nom}
                                                </div>
                                                <div className="text-sm text-gray-500">{orderItem.email}</div>
                                                <div className="text-sm text-gray-500">{orderItem.telephone}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {orderItem.annonceId?.titre || orderItem.annonceTitre}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {orderItem.annonceId?.marque} {orderItem.annonceId?.modele}
                                                </div>
                                                <a
                                                    href={`/ads/${orderItem.annonceId?._id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    Voir l'annonce →
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {orderItem.infoBancaires?.montant || orderItem.annoncePrice}{" "}
                                                {orderItem.infoBancaires?.devise || orderItem.annonceDevise}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getStatutBadge(orderItem.statut)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(orderItem.dateCommande || orderItem.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => openStatusModal(orderItem)} className="text-blue-600 hover:text-blue-900">
                                                Modifier statut
                                            </button>
                                            <button
                                                onClick={() => openDetailsModal(orderItem)}
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

                {/* Modal des détails */}
                {showDetailsModal && selectedOrder && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Détails de la commande - {selectedOrder.prenom} {selectedOrder.nom}
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
                                                    {selectedOrder.prenom} {selectedOrder.nom}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Email :</span>{" "}
                                                <span className="font-medium">{selectedOrder.email}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Téléphone :</span>{" "}
                                                <span className="font-medium">{selectedOrder.telephone}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Adresse :</span>{" "}
                                                <span className="font-medium">
                                                    {selectedOrder.numeroRue} {selectedOrder.rue}, {selectedOrder.codePostal}{" "}
                                                    {selectedOrder.ville}
                                                </span>
                                            </div>
                                            {selectedOrder.canton && (
                                                <div>
                                                    <span className="text-gray-600">Canton :</span>{" "}
                                                    <span className="font-medium">{selectedOrder.canton}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-gray-600">Pays :</span>{" "}
                                                <span className="font-medium">{selectedOrder.pays}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informations commande */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-3">Informations commande</h4>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="text-gray-600">Annonce :</span>{" "}
                                                <span className="font-medium">
                                                    {selectedOrder.annonceId?.titre || selectedOrder.annonceTitre}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Prix :</span>{" "}
                                                <span className="font-medium">
                                                    {selectedOrder.annoncePrice} {selectedOrder.annonceDevise}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Statut :</span> {getStatutBadge(selectedOrder.statut)}
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Date commande :</span>{" "}
                                                <span className="font-medium">
                                                    {formatDate(selectedOrder.dateCommande || selectedOrder.createdAt)}
                                                </span>
                                            </div>
                                            {selectedOrder.datePassageEnCours && (
                                                <div>
                                                    <span className="text-gray-600">Passage en cours :</span>{" "}
                                                    <span className="font-medium">{formatDate(selectedOrder.datePassageEnCours)}</span>
                                                </div>
                                            )}
                                            {selectedOrder.dateTerminee && (
                                                <div>
                                                    <span className="text-gray-600">Date terminée :</span>{" "}
                                                    <span className="font-medium">{formatDate(selectedOrder.dateTerminee)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Informations bancaires */}
                                    {selectedOrder.infoBancaires && (
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-3">Informations bancaires</h4>
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <span className="text-gray-600">IBAN :</span>{" "}
                                                    <span className="font-medium">{selectedOrder.infoBancaires.iban}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">BIC :</span>{" "}
                                                    <span className="font-medium">{selectedOrder.infoBancaires.bic}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Montant :</span>{" "}
                                                    <span className="font-medium">
                                                        {selectedOrder.infoBancaires.montant} {selectedOrder.infoBancaires.devise}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents client */}
                                    {selectedOrder.documentsClient && selectedOrder.documentsClient.bordereauPaiement && (
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-3">Documents client</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">Bordereau de paiement</span>
                                                        <a
                                                            href={selectedOrder.documentsClient.bordereauPaiement.secure_url}
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
                                                        Uploadé le {formatDate(selectedOrder.documentsClient.bordereauPaiement.uploaded_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Message */}
                                    {selectedOrder.message && (
                                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-2">Message du client</h4>
                                            <p className="text-sm text-gray-700">{selectedOrder.message}</p>
                                        </div>
                                    )}
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

                {/* Modal de modification du statut */}
                {showStatusModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Modifier le statut - {selectedOrder?.prenom} {selectedOrder?.nom}
                                    </h3>
                                    <button onClick={closeStatusModal} className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmitStatus} className="space-y-4">
                                    {/* Statut */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau statut *</label>
                                        <select
                                            value={statusForm.statut}
                                            onChange={(e) => setStatusForm((prev) => ({ ...prev, statut: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="en_attente">En attente</option>
                                            <option value="en_cours">En cours</option>
                                            <option value="termine">Terminé</option>
                                            <option value="annule">Annulé</option>
                                        </select>
                                    </div>

                                    {/* Note */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Note (optionnelle)</label>
                                        <textarea
                                            value={statusForm.note}
                                            onChange={(e) => setStatusForm((prev) => ({ ...prev, note: e.target.value }))}
                                            placeholder="Ajoutez une note sur ce changement de statut..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Boutons */}
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeStatusModal}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updatingStatus}
                                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {updatingStatus ? "Mise à jour..." : "Mettre à jour"}
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