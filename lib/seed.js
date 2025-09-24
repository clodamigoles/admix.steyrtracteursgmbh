import { connectDB } from './mongodb'
import { initializeDatabase } from './database'

export async function seedDatabase() {
    try {
        await connectDB()
        console.log('🌱 Starting database seeding...')

        // Initialiser d'abord les données de base
        await initializeDatabase()

        // Importer les modèles
        const { Category, Vendeur, Annonce } = require('../models')

        // Ajouter quelques vendeurs de test
        const vendeurs = await Vendeur.find()
        if (vendeurs.length === 0) {
            await createSampleVendeurs()
        }

        // Ajouter quelques annonces de test
        const annonces = await Annonce.find()
        if (annonces.length === 0) {
            await createSampleAnnonces()
        }

        console.log('✅ Database seeding completed')
    } catch (error) {
        console.error('❌ Database seeding error:', error)
        throw error
    }
}

async function createSampleVendeurs() {
    const { Vendeur } = require('../models')

    const sampleVendeurs = [
        {
            nom: 'Transport Dupont',
            email: 'contact@transport-dupont.fr',
            telephone: '01 23 45 67 89',
            ville: 'Lyon',
            codePostal: '69000',
            pays: 'France',
            activite: true,
            avisNote: 4.2
        },
        {
            nom: 'Machines Agricoles Martin',
            email: 'info@martin-agri.fr',
            telephone: '02 34 56 78 90',
            ville: 'Toulouse',
            codePostal: '31000',
            pays: 'France',
            activite: true,
            avisNote: 4.7
        },
        {
            nom: 'Équipements Bernard',
            email: 'vente@equipements-bernard.fr',
            telephone: '03 45 67 89 01',
            ville: 'Marseille',
            codePostal: '13000',
            pays: 'France',
            activite: true,
            avisNote: 4.0
        }
    ]

    for (const vendeurData of sampleVendeurs) {
        const vendeur = new Vendeur(vendeurData)
        await vendeur.save()
        console.log(`✅ Created sample vendeur: ${vendeur.nom}`)
    }
}

async function createSampleAnnonces() {
    const { Annonce, Category, Vendeur } = require('../models')

    const categories = await Category.find({ niveau: { $gte: 2 } }) // Sous-catégories
    const vendeurs = await Vendeur.find()

    if (categories.length === 0 || vendeurs.length === 0) {
        console.log('⚠️ No categories or vendors found, skipping annonces creation')
        return
    }

    const sampleAnnonces = [
        {
            titre: 'Camion Volvo FH16 750 en excellent état',
            marque: 'Volvo',
            modele: 'FH16 750',
            pays: 'France',
            etat: 'occasion',
            prix: 85000,
            devise: 'EUR',
            annee: 2019,
            typeCarburant: 'diesel',
            kilometrage: 450000,
            puissance: 750,
            caracteristiques: [
                { nom: 'Transmission', valeur: 'Automatique I-Shift' },
                { nom: 'Cabine', valeur: 'Globetrotter XL' },
                { nom: 'Couleur', valeur: 'Blanc' }
            ],
            plusInfos: 'Véhicule bien entretenu, carnet de maintenance à jour.',
            statut: 'active'
        },
        {
            titre: 'Tracteur John Deere 8370R - Parfait pour grandes exploitations',
            marque: 'John Deere',
            modele: '8370R',
            pays: 'France',
            etat: 'occasion',
            prix: 120000,
            devise: 'EUR',
            annee: 2018,
            typeCarburant: 'diesel',
            puissance: 370,
            caracteristiques: [
                { nom: 'Heures', valeur: '3500', unite: 'h' },
                { nom: 'Direction', valeur: 'Assistée' },
                { nom: 'GPS', valeur: 'StarFire 3000' }
            ],
            plusInfos: 'Tracteur professionnel avec équipement GPS intégré.',
            statut: 'active'
        }
    ]

    for (const annonceData of sampleAnnonces) {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)]
        const randomVendeur = vendeurs[Math.floor(Math.random() * vendeurs.length)]

        const annonce = new Annonce({
            ...annonceData,
            categorieId: randomCategory._id,
            vendeurId: randomVendeur._id,
            stats: {
                vues: Math.floor(Math.random() * 1000),
                favoris: Math.floor(Math.random() * 50),
                postedAt: new Date()
            }
        })

        await annonce.save()
        console.log(`✅ Created sample annonce: ${annonce.titre}`)
    }
}