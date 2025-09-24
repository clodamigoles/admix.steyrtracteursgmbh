import { testCloudinaryConnection } from '@/lib/cloudinary'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        console.log('=== TEST CLOUDINARY ===')
        console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Défini' : '❌ Manquant')
        console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Défini' : '❌ Manquant')
        console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Défini (caché)' : '❌ Manquant')

        const isConnected = await testCloudinaryConnection()

        return res.status(200).json({
            success: true,
            data: {
                connected: isConnected,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'Non défini',
                apiKey: process.env.CLOUDINARY_API_KEY || 'Non défini',
                hasSecret: !!process.env.CLOUDINARY_API_SECRET
            }
        })

    } catch (error) {
        console.error('Erreur test Cloudinary:', error)
        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}