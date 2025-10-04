import { connectDB, disconnectDB, isConnected, getDBStats, mongoose } from "./mongodb"

export { connectDB }

// Fonction pour initialiser la base de données avec des données par défaut
export async function initializeDatabase() {
    try {
        await connectDB()
        console.log("🚀 Database initialization started...")

        // Importer les modèles pour s'assurer qu'ils sont enregistrés
        const { Category, Vendeur, User } = require("../models")

        // Créer les catégories par défaut si elles n'existent pas
        const categoryCount = await Category.countDocuments()
        if (categoryCount === 0) {
            await createDefaultCategories()
        }

        // Créer un utilisateur admin par défaut
        const adminExists = await User.findOne({ role: "admin" })
        if (!adminExists) {
            await createDefaultAdmin()
        }

        console.log("✅ Database initialization completed")
    } catch (error) {
        console.error("❌ Database initialization error:", error)
        throw error
    }
}

// Créer les catégories par défaut
async function createDefaultCategories() {
    const { Category } = require("../models")

    const defaultCategories = [
        // Catégories mères
        { nom: "Véhicules lourds", slug: "vehicules-lourds", niveau: 1, icon: "🚛" },
        { nom: "Matériel agricole", slug: "materiel-agricole", niveau: 1, icon: "🚜" },
        { nom: "Équipements", slug: "equipements", niveau: 1, icon: "⚙️" },
        { nom: "Pièces détachées", slug: "pieces-detachees", niveau: 1, icon: "🔧" },
    ]

    for (const categoryData of defaultCategories) {
        const category = new Category(categoryData)
        await category.save()
        console.log(`✅ Created category: ${category.nom}`)

        // Ajouter quelques sous-catégories pour les véhicules lourds
        if (category.slug === "vehicules-lourds") {
            const subCategories = [
                { nom: "Camions", slug: "camions", niveau: 2, parentId: category._id },
                { nom: "Semi-remorques", slug: "semi-remorques", niveau: 2, parentId: category._id },
                { nom: "Bus", slug: "bus", niveau: 2, parentId: category._id },
            ]

            for (const subCat of subCategories) {
                const subCategory = new Category(subCat)
                await subCategory.save()
                console.log(`  ✅ Created sub-category: ${subCategory.nom}`)
            }
        }

        // Ajouter quelques sous-catégories pour le matériel agricole
        if (category.slug === "materiel-agricole") {
            const subCategories = [
                { nom: "Tracteurs", slug: "tracteurs", niveau: 2, parentId: category._id },
                { nom: "Moissonneuses", slug: "moissonneuses", niveau: 2, parentId: category._id },
                { nom: "Outils agricoles", slug: "outils-agricoles", niveau: 2, parentId: category._id },
            ]

            for (const subCat of subCategories) {
                const subCategory = new Category(subCat)
                await subCategory.save()
                console.log(`  ✅ Created sub-category: ${subCategory.nom}`)
            }
        }
    }
}

// Créer un utilisateur admin par défaut
async function createDefaultAdmin() {
    const { User } = require("../models")

    const adminUser = new User({
        username: "admin",
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        role: "admin",
        isActive: true,
    })

    await adminUser.save()
    console.log("✅ Created default admin user")
}

// Fonction pour nettoyer la base de données (utile pour les tests)
export async function clearDatabase() {
    try {
        await connectDB()
        const collections = await mongoose.connection.db.collections()

        for (const collection of collections) {
            await collection.deleteMany({})
        }

        console.log("🧹 Database cleared")
    } catch (error) {
        console.error("❌ Error clearing database:", error)
        throw error
    }
}

// Fonction pour créer les index nécessaires
export async function createIndexes() {
    try {
        await connectDB()

        const { Category, Vendeur, Annonce, Devis, Recherche } = require("../models")

        // Index pour les catégories
        await Category.collection.createIndex({ slug: 1 }, { unique: true })
        await Category.collection.createIndex({ niveau: 1, parentId: 1 })

        // Index pour les vendeurs
        await Vendeur.collection.createIndex({ nom: "text", ville: "text" })
        await Vendeur.collection.createIndex({ activite: 1 })

        // Index pour les annonces
        await Annonce.collection.createIndex({ statut: 1, createdAt: -1 })
        await Annonce.collection.createIndex({ categorieId: 1, statut: 1 })
        await Annonce.collection.createIndex({ vendeurId: 1 })
        await Annonce.collection.createIndex({ titre: "text", marque: "text", modele: "text" })

        // Index pour les devis
        await Devis.collection.createIndex({ statut: 1, createdAt: -1 })
        await Devis.collection.createIndex({ annonceId: 1 })
        await Devis.collection.createIndex({ email: 1 })

        // Index pour les recherches
        await Recherche.collection.createIndex({ createdAt: -1 })
        await Recherche.collection.createIndex({ categorieId: 1 })

        console.log("✅ Database indexes created")
    } catch (error) {
        console.error("❌ Error creating indexes:", error)
        throw error
    }
}

// Fonction de backup de la base de données (basique)
export async function backupDatabase() {
    try {
        await connectDB()
        const collections = ["categories", "vendeurs", "annonces", "devis", "users"]
        const backup = {}

        for (const collectionName of collections) {
            const collection = mongoose.connection.db.collection(collectionName)
            backup[collectionName] = await collection.find({}).toArray()
        }

        return {
            timestamp: new Date().toISOString(),
            data: backup,
        }
    } catch (error) {
        console.error("❌ Error creating backup:", error)
        throw error
    }
}

// Fonction pour valider la santé de la base de données
export async function checkDatabaseHealth() {
    try {
        await connectDB()
        const db = mongoose.connection.db

        // Vérifier la connexion
        await db.admin().ping()

        // Vérifier les collections essentielles
        const collections = await db.listCollections().toArray()
        const collectionNames = collections.map((c) => c.name)

        const requiredCollections = ["categories", "vendeurs", "annonces", "devis", "users"]
        const missingCollections = requiredCollections.filter((name) => !collectionNames.includes(name))

        // Obtenir les stats de base
        const stats = await getDBStats()

        return {
            status: "healthy",
            connected: true,
            collections: {
                total: collectionNames.length,
                required: requiredCollections.length,
                missing: missingCollections,
            },
            stats,
        }
    } catch (error) {
        return {
            status: "unhealthy",
            connected: false,
            error: error.message,
        }
    }
}

// Export des utilitaires
export default {
    connectDB,
    disconnectDB,
    isConnected,
    getDBStats,
    initializeDatabase,
    clearDatabase,
    createIndexes,
    backupDatabase,
    checkDatabaseHealth,
}