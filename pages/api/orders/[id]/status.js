import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import { authMiddleware } from "@/lib/middleware/auth"

export default async function handler(req, res) {
    await connectDB()

    // Vérifier l'authentification admin
    const authResult = await authMiddleware(req, res)
    if (!authResult.success) {
        return res.status(401).json({ success: false, message: authResult.message })
    }

    const { id } = req.query

    if (req.method === "PATCH") {
        try {
            const { statut, note } = req.body

            // Validation du statut
            const statutsValides = ["en_attente", "en_cours", "termine", "annule"]
            if (!statut || !statutsValides.includes(statut)) {
                return res.status(400).json({
                    success: false,
                    message: "Statut invalide",
                })
            }

            // Trouver la commande
            const order = await Order.findById(id)
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Commande non trouvée",
                })
            }

            // Mettre à jour le statut et les dates
            const updateData = { statut }

            // Mettre à jour les dates selon le statut
            if (statut === "en_cours" && order.statut !== "en_cours") {
                updateData.datePassageEnCours = new Date()
            } else if (statut === "termine" && order.statut !== "termine") {
                updateData.dateTerminee = new Date()
            }

            // Ajouter la note si fournie
            if (note) {
                updateData.noteAdmin = note
            }

            // Mettre à jour la commande
            const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true }).populate(
                "annonceId",
                "titre marque modele prix devise",
            )

            res.status(200).json({
                success: true,
                data: updatedOrder,
                message: "Statut mis à jour avec succès",
            })
        } catch (error) {
            console.error("Erreur lors de la mise à jour du statut:", error)
            res.status(500).json({
                success: false,
                message: "Erreur lors de la mise à jour du statut",
            })
        }
    } else {
        res.setHeader("Allow", ["PATCH"])
        res.status(405).json({
            success: false,
            message: `Méthode ${req.method} non autorisée`,
        })
    }
}