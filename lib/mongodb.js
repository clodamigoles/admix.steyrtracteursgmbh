import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
    )
}

/**
 * Global est utilisé ici pour maintenir une connexion mise en cache entre les rechargements à chaud
 * en développement. Cela évite de créer de nouvelles connexions à chaque changement de fichier.
 */
let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            // Options de connexion recommandées
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // Maintenir jusqu'à 10 connexions socket
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4 // Use IPv4, skip trying IPv6
        }

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('✅ Connected to MongoDB')
            return mongoose
        })
    }

    try {
        cached.conn = await cached.promise
    } catch (e) {
        cached.promise = null
        console.error('❌ MongoDB connection error:', e)
        throw e
    }

    return cached.conn
}

// Fonction pour déconnecter MongoDB (utile pour les tests)
export async function disconnectDB() {
    if (cached.conn) {
        await cached.conn.disconnect()
        cached.conn = null
        cached.promise = null
        console.log('🔌 Disconnected from MongoDB')
    }
}

// Fonction pour vérifier l'état de la connexion
export function isConnected() {
    return mongoose.connection.readyState === 1
}

// Fonction pour obtenir les statistiques de la base de données
export async function getDBStats() {
    try {
        await connectDB()
        const db = mongoose.connection.db
        const stats = await db.admin().serverStatus()

        return {
            connected: isConnected(),
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name,
            collections: Object.keys(mongoose.connection.collections).length,
            uptime: stats.uptime,
            version: stats.version,
            connections: stats.connections
        }
    } catch (error) {
        console.error('Error getting DB stats:', error)
        return {
            connected: false,
            error: error.message
        }
    }
}

// Event listeners pour logging
mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB')
})

mongoose.connection.on('error', (err) => {
    console.error('🔴 Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected from MongoDB')
})

// Fermer la connexion MongoDB quand le processus Node.js se termine
process.on('SIGINT', async () => {
    await mongoose.connection.close()
    console.log('🔌 MongoDB connection closed through app termination')
    process.exit(0)
})

process.on('SIGTERM', async () => {
    await mongoose.connection.close()
    console.log('🔌 MongoDB connection closed through app termination')
    process.exit(0)
})

export { connectDB }
export default connectDB