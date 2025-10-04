import { put } from '@vercel/blob';
import multer from 'multer';
import crypto from 'crypto';

// Configuration Multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
        }
    },
});

// Générer un nom aléatoire
const generateRandomFilename = () => {
    return `devis_${crypto.randomBytes(8).toString('hex')}.pdf`;
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Méthode non autorisée' });
    }

    try {
        // Parser le fichier
        await new Promise((resolve, reject) => {
            upload.single('devis')(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier fourni' });
        }

        const filename = generateRandomFilename();

        // Upload vers Vercel Blob
        const blob = await put(filename, req.file.buffer, {
            access: 'public',
            contentType: 'application/pdf',
        });

        // Retourner l'URL publique
        return res.status(200).json({
            success: true,
            message: 'Devis uploadé avec succès',
            data: {
                url: blob.url,
                downloadUrl: blob.downloadUrl,
                pathname: blob.pathname,
                contentType: blob.contentType,
                size: blob.size,
            },
        });
    } catch (error) {
        console.error('Erreur lors de l\'upload du devis:', error);

        if (error.message === 'Seuls les fichiers PDF sont acceptés') {
            return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({
            message: 'Erreur lors de l\'upload du devis',
            error: error.message
        });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};