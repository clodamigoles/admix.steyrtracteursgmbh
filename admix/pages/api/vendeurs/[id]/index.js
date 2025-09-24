import { connectDB } from '@/lib/mongodb'
import Vendeur from '@/models/Vendeur'

export default async function handler(req, res) {
    await connectDB()

    const { id } = req.query

    switch (req.method) {
        case 'GET':
            return await getVendeurById(req, res, id)
        case 'PUT':
            return await updateVendeur(req, res, id)
        case 'DELETE':
            return await deleteVendeur(req, res, id)
        default:
            return res.status(405).json({
                success: false,
                error: 'Méthode non autorisée'
            })
    }
}

// GET /api/vendeurs/[id]
async function getVendeurById(req, res, id) {
    try {
        const vendeur = await Vendeur.findById(id)

        if (!vendeur) {
            return res.status(404).json({
                success: false,
                error: 'Vendeur introuvable'
            })
        }

        return res.status(200).json({
            success: true,
            data: vendeur
        })

    } catch (error) {
        console.error('Erreur lors de la récupération du vendeur:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        })
    }
}

// PUT /api/vendeurs/[id]
async function updateVendeur(req, res, id) {
    try {
        console.log('PUT vendeur', id, 'avec body:', req.body)

        const existingVendeur = await Vendeur.findById(id)
        if (!existingVendeur) {
            return res.status(404).json({
                success: false,
                error: 'Vendeur introuvable'
            })
        }

        const {
            nom,
            logo,
            couverture,
            avisNote,
            activite,
            email,
            telephone,
            adresse,
            ville,
            codePostal,
            pays,
            description
        } = req.body

        // Validation du nom
        if (!nom) {
            return res.status(400).json({
                success: false,
                error: 'Le nom du vendeur est requis'
            })
        }

        // Préparer les données de mise à jour
        const updateData = {
            nom: nom.trim(),
            avisNote: parseFloat(avisNote) || existingVendeur.avisNote,
            activite: activite !== undefined ? Boolean(activite) : existingVendeur.activite,
            email: email?.trim().toLowerCase(),
            telephone: telephone?.trim(),
            adresse: adresse?.trim(),
            ville: ville?.trim(),
            codePostal: codePostal?.trim(),
            pays: pays?.trim() || existingVendeur.pays,
            description: description?.trim()
        }

        // Gérer le logo
        if (logo !== undefined) {
            if (logo === null || logo === '') {
                updateData.logo = undefined
            } else if (typeof logo === 'object' && logo.public_id) {
                updateData.logo = {
                    public_id: logo.public_id,
                    secure_url: logo.secure_url,
                    width: logo.width,
                    height: logo.height,
                    format: logo.format,
                    size: logo.size
                }
            }
        }

        // Gérer la couverture
        if (couverture !== undefined) {
            if (couverture === null || couverture === '') {
                updateData.couverture = undefined
            } else if (typeof couverture === 'object' && couverture.public_id) {
                updateData.couverture = {
                    public_id: couverture.public_id,
                    secure_url: couverture.secure_url,
                    width: couverture.width,
                    height: couverture.height,
                    format: couverture.format,
                    size: couverture.size
                }
            }
        }

        console.log('Données de mise à jour:', updateData)

        // Mise à jour du vendeur
        const updatedVendeur = await Vendeur.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )

        console.log('Vendeur mis à jour avec succès:', updatedVendeur._id)

        return res.status(200).json({
            success: true,
            data: updatedVendeur,
            message: 'Vendeur mis à jour avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la mise à jour du vendeur:', error)

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message)
            return res.status(400).json({
                success: false,
                error: 'Erreur de validation: ' + validationErrors.join(', ')
            })
        }

        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la mise à jour'
        })
    }
}

// DELETE /api/vendeurs/[id]
async function deleteVendeur(req, res, id) {
    try {
        // Vérifier que le vendeur existe
        const vendeur = await Vendeur.findById(id)
        if (!vendeur) {
            return res.status(404).json({
                success: false,
                error: 'Vendeur introuvable'
            })
        }

        console.log('Suppression du vendeur:', vendeur.nom)

        // TODO: Vérifier s'il y a des annonces liées
        // const { Annonce } = require('../../../models')
        // const hasAnnonces = await Annonce.countDocuments({ vendeurId: id })
        // if (hasAnnonces > 0) {
        //   return res.status(400).json({
        //     success: false,
        //     error: 'Impossible de supprimer un vendeur qui a des annonces actives'
        //   })
        // }

        // La suppression des images Cloudinary se fait côté front
        // avant l'appel à cette API

        await Vendeur.findByIdAndDelete(id)

        console.log('Vendeur supprimé avec succès')

        return res.status(200).json({
            success: true,
            message: 'Vendeur supprimé avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la suppression du vendeur:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression'
        })
    }
}