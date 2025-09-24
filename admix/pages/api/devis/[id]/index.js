import { connectDB } from '@/lib/mongodb'
import { Devis } from '@/models'

export default async function handler(req, res) {
    await connectDB()

    const { id } = req.query

    switch (req.method) {
        case 'GET':
            return await getDevisById(req, res, id)
        case 'PUT':
            return await updateDevis(req, res, id)
        case 'DELETE':
            return await deleteDevis(req, res, id)
        default:
            return res.status(405).json({
                success: false,
                error: 'Méthode non autorisée'
            })
    }
}

// GET /api/devis/[id]
async function getDevisById(req, res, id) {
    try {
        const devis = await Devis.findById(id)
            .populate({
                path: 'annonceId',
                select: 'titre marque modele prix devise photos statut vendeurId',
                populate: {
                    path: 'vendeurId',
                    select: 'nom email telephone ville logo'
                }
            })

        if (!devis) {
            return res.status(404).json({
                success: false,
                error: 'Devis introuvable'
            })
        }

        return res.status(200).json({
            success: true,
            data: devis
        })

    } catch (error) {
        console.error('Erreur lors de la récupération du devis:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        })
    }
}

// PUT /api/devis/[id]
async function updateDevis(req, res, id) {
    try {
        const existingDevis = await Devis.findById(id)
        if (!existingDevis) {
            return res.status(404).json({
                success: false,
                error: 'Devis introuvable'
            })
        }

        const {
            nom,
            prenom,
            email,
            telephone,
            numeroRue,
            rue,
            codePostal,
            ville,
            canton,
            pays,
            message,
            note,
            statut
        } = req.body

        // Validation des champs requis seulement s'ils sont fournis
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Format d\'email invalide'
            })
        }

        // Validation du statut
        const statutsValides = ['nouveau', 'en_cours', 'envoye', 'accepte', 'refuse', 'expire']
        if (statut && !statutsValides.includes(statut)) {
            return res.status(400).json({
                success: false,
                error: 'Statut invalide'
            })
        }

        // Mise à jour
        const updatedDevis = await Devis.findByIdAndUpdate(
            id,
            {
                ...(nom && { nom: nom.trim() }),
                ...(prenom && { prenom: prenom.trim() }),
                ...(email && { email: email.toLowerCase().trim() }),
                ...(telephone && { telephone: telephone.trim() }),
                ...(numeroRue && { numeroRue: numeroRue.trim() }),
                ...(rue && { rue: rue.trim() }),
                ...(codePostal && { codePostal: codePostal.trim() }),
                ...(ville && { ville: ville.trim() }),
                ...(canton && { canton: canton.trim() }),
                ...(pays && { pays: pays.trim() }),
                ...(message !== undefined && { message: message?.trim() }),
                ...(note !== undefined && { note: note?.trim() }),
                ...(statut && { statut })
            },
            { new: true, runValidators: true }
        )
            .populate({
                path: 'annonceId',
                select: 'titre marque modele prix devise',
                populate: {
                    path: 'vendeurId',
                    select: 'nom email telephone'
                }
            })

        return res.status(200).json({
            success: true,
            data: updatedDevis,
            message: 'Devis mis à jour avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la mise à jour du devis:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la mise à jour'
        })
    }
}

// DELETE /api/devis/[id]
async function deleteDevis(req, res, id) {
    try {
        const devis = await Devis.findById(id)
        if (!devis) {
            return res.status(404).json({
                success: false,
                error: 'Devis introuvable'
            })
        }

        await Devis.findByIdAndDelete(id)

        return res.status(200).json({
            success: true,
            message: 'Devis supprimé avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la suppression du devis:', error)
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression'
        })
    }
}