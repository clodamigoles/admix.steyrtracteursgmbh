import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models"
import nodemailer from "nodemailer"
const { getTranslation, getEmailSubject } = require("@/lib/email-translations")

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Méthode non autorisée",
        })
    }

    await connectDB()

    const { id } = req.query
    const { bonCommande, iban, bic, montantAPayer, devise = "EUR", langue } = req.body

    console.log("📧 [API] ========== DÉBUT ENVOYER BON COMMANDE ==========")
    console.log("📧 [API] Body complet:", req.body)
    console.log("📧 [API] Langue reçue:", langue)
    console.log("📧 [API] Type de langue:", typeof langue)

    try {
        // Validation des champs requis
        if (!bonCommande || !iban || !bic || !montantAPayer) {
            return res.status(400).json({
                success: false,
                error: "Tous les champs sont requis (bon de commande, IBAN, BIC, montant)",
            })
        }

        // Validation de la langue
        if (!langue) {
            console.log("❌ [API] Langue manquante!")
            return res.status(400).json({
                success: false,
                error: "La langue est requise",
            })
        }

        console.log("✅ [API] Validation OK - langue:", langue)

        // Validation du montant
        if (montantAPayer <= 0) {
            return res.status(400).json({
                success: false,
                error: "Le montant doit être supérieur à 0",
            })
        }

        // Récupérer la commande avec les données de l'annonce
        const order = await Order.findById(id).populate({
            path: "annonceId",
            select: "titre marque modele prix devise photos vendeurId",
            populate: {
                path: "vendeurId",
                select: "nom email telephone ville",
            },
        })

        if (!order) {
            return res.status(404).json({
                success: false,
                error: "Commande introuvable",
            })
        }

        // Mettre à jour la commande avec le bon de commande et infos bancaires
        console.log("💾 [API] Sauvegarde dans la DB avec langue:", langue)
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            {
                "infoBancaires.bonCommande": bonCommande,
                "infoBancaires.bonCommandeDownloadUrl": bonCommande,
                "infoBancaires.iban": iban.trim(),
                "infoBancaires.bic": bic.trim(),
                "infoBancaires.montant": montantAPayer,
                "infoBancaires.devise": devise,
                "infoBancaires.langue": langue,
                "infoBancaires.dateEnvoi": new Date(),
                statut: "en_attente", // Passe en attente de paiement
            },
            { new: true },
        ).populate({
            path: "annonceId",
            select: "titre marque modele prix devise photos",
            populate: {
                path: "vendeurId",
                select: "nom email telephone ville",
            },
        })

        console.log("📧 [API] Envoi de l'email avec langue:", langue)
        await envoyerEmailClient(updatedOrder, langue)

        // Marquer l'email comme envoyé
        await Order.findByIdAndUpdate(id, {
            "infoBancaires.emailEnvoye": true,
            "infoBancaires.dateEmailEnvoye": new Date(),
        })

        return res.status(200).json({
            success: true,
            data: updatedOrder,
            message: "Bon de commande envoyé avec succès au client",
        })
    } catch (error) {
        console.error("Error in envoyer-bon-commande API:", error)
        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors de l'envoi du bon de commande",
            details: error.message,
        })
    }
}

async function envoyerEmailClient(order, langue) {
    try {
        console.log("📨 [EMAIL] ========== GÉNÉRATION EMAIL ==========")
        console.log("📨 [EMAIL] Langue reçue:", langue)
        console.log("📨 [EMAIL] Langue depuis order:", order.infoBancaires?.langue)

        // Fonction helper pour les traductions
        const t = (path) => {
            const translation = getTranslation("order", path, langue)
            console.log(`📨 [EMAIL] Traduction [${path}] en [${langue}]:`, translation)
            return translation
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number.parseInt(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })

        const annonce = order.annonceId
        const vendeur = annonce.vendeurId
        const urlProduit = `${process.env.NEXT_PUBLIC_SITE_URL}/ads/${annonce._id}`
        const urlValidation = `${process.env.NEXT_PUBLIC_SITE_URL}/orders/${order._id}`

        const bonCommandeDownloadUrl = order.infoBancaires.bonCommandeDownloadUrl || order.infoBancaires.bonCommande

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${t("title")}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body { 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6; 
                    color: #1f2937;
                    background-color: #f9fafb;
                    font-weight: 400;
                }
                
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px;
                }
                
                .header { 
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    padding: 32px 24px; 
                    border-radius: 16px; 
                    margin-bottom: 24px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                }
                
                .header h1 {
                    font-size: 24px;
                    font-weight: 600;
                    color: #111827;
                    margin-bottom: 8px;
                    letter-spacing: -0.025em;
                }
                
                .header p {
                    font-size: 16px;
                    color: #6b7280;
                    font-weight: 400;
                }
                
                .content { 
                    background: #ffffff; 
                    padding: 32px 24px; 
                    border: 1px solid #e5e7eb; 
                    border-radius: 16px;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                }
                
                .content p {
                    font-size: 15px;
                    margin-bottom: 16px;
                    color: #374151;
                    line-height: 1.7;
                }
                
                .content h3 {
                    font-size: 18px;
                    font-weight: 600;
                    color: #111827;
                    margin: 24px 0 12px 0;
                    letter-spacing: -0.025em;
                }
                
                .content ol {
                    margin: 16px 0;
                    padding-left: 20px;
                }
                
                .content li {
                    font-size: 15px;
                    color: #374151;
                    margin-bottom: 8px;
                    line-height: 1.6;
                }
                
                .button { 
                    display: inline-block; 
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    color: #ffffff; 
                    padding: 14px 28px; 
                    text-decoration: none; 
                    border-radius: 12px; 
                    margin: 8px 6px;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                    letter-spacing: -0.025em;
                }
                
                .button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
                }
                
                .button-primary {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: #ffffff;
                }
                
                .button-primary:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                }
                
                .button-secondary { 
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: #ffffff;
                }
                
                .button-secondary:hover {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                }
                
                .details { 
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    padding: 20px; 
                    border-radius: 12px; 
                    margin: 20px 0;
                    border: 1px solid #e2e8f0;
                }
                
                .details h3 {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 12px;
                    letter-spacing: -0.025em;
                }
                
                .details p {
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 8px;
                    line-height: 1.6;
                }
                
                .details strong {
                    font-weight: 500;
                    color: #334155;
                }
                
                .details a {
                    color: #3b82f6;
                    text-decoration: none;
                    font-weight: 500;
                }
                
                .details a:hover {
                    color: #2563eb;
                    text-decoration: underline;
                }
                
                .button-container {
                    text-align: center; 
                    margin: 32px 0;
                    padding: 24px 0;
                    border-top: 1px solid #f3f4f6;
                    border-bottom: 1px solid #f3f4f6;
                }
                
                .footer { 
                    margin-top: 32px; 
                    padding: 24px 0; 
                    border-top: 1px solid #e5e7eb; 
                    font-size: 13px; 
                    color: #6b7280;
                    line-height: 1.6;
                }
                
                .footer p {
                    margin-bottom: 8px;
                }
                
                .signature {
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 16px;
                }
                
                @media (max-width: 600px) {
                    .container {
                        padding: 16px;
                    }
                    
                    .header, .content {
                        padding: 24px 20px;
                    }
                    
                    .button {
                        display: block;
                        text-align: center;
                        margin: 12px 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${t("title")}</h1>
                    <p>${t("greeting")} ${order.prenom} ${order.nom},</p>
                </div>

                <div class="content">
                    <p>${t("intro")}</p>

                    <div class="details">
                        <h3>${annonce.titre}</h3>
                        <p><strong>${t("marque")}:</strong> ${annonce.marque}</p>
                        ${annonce.modele ? `<p><strong>${t("modele")}:</strong> ${annonce.modele}</p>` : ""}
                        <p><strong>${t("vendeur")}:</strong> ${vendeur.nom}</p>
                        <p><strong>${t("voirAnnonce")}:</strong> <a href="${urlProduit}">${t("cliquerIci")}</a></p>
                    </div>

                    <h3>${t("infoPaiement")}</h3>
                    <div class="details">
                        <p><strong>${t("montantAPayer")}:</strong> ${order.infoBancaires.montant} ${order.infoBancaires.devise}</p>
                        <p><strong>IBAN:</strong> ${order.infoBancaires.iban}</p>
                        <p><strong>BIC:</strong> ${order.infoBancaires.bic}</p>
                        <p><strong>${t("reference")}:</strong> ${order._id.toString().slice(-8)}</p>
                    </div>

                    <p>${t("pourFinaliser")}</p>
                    <ol>
                        <li>${t("step1")}</li>
                        <li>${t("step2")}</li>
                        <li>${t("step3")}</li>
                    </ol>

                    <div class="button-container">
                        <a href="${bonCommandeDownloadUrl}" class="button button-secondary">${t("telechargerBon")}</a>
                        <a href="${urlValidation}" class="button button-primary">${t("validerCommande")}</a>
                    </div>

                    <p>${t("questions")}</p>
                </div>

                <div class="footer">
                    <div class="signature">
                        <p>${t("cordialement")},<br>${t("equipe")}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `

        console.log("📨 [EMAIL] Sujet email:", getEmailSubject("order", langue, annonce.titre))

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: order.email,
            subject: getEmailSubject("order", langue, annonce.titre),
            html: htmlContent,
        }

        console.log("📨 [EMAIL] Email préparé pour:", order.email)
        console.log("📨 [EMAIL] Langue finale utilisée:", langue)

        await transporter.sendMail(mailOptions)
    } catch (error) {
        console.error("Error in envoyerEmailClient:", error)
        throw error
    }
}