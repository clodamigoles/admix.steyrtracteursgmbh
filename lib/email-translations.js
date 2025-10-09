// Système de traductions pour les emails multilingues
// Utilise CommonJS pour compatibilité avec Next.js API routes

const EMAIL_TRANSLATIONS = {
    // Traductions pour les BONS DE COMMANDE (orders)
    order: {
        subject: {
            fr: "Votre bon de commande",
            de: "Ihr Bestellschein",
        },
        title: {
            fr: "Votre bon de commande",
            de: "Ihr Bestellschein",
        },
        greeting: {
            fr: "Bonjour",
            de: "Guten Tag",
        },
        intro: {
            fr: "Nous avons le plaisir de vous transmettre votre bon de commande pour :",
            de: "Wir freuen uns, Ihnen Ihren Bestellschein für folgendes Produkt zu übermitteln:",
        },
        marque: {
            fr: "Marque",
            de: "Marke",
        },
        modele: {
            fr: "Modèle",
            de: "Modell",
        },
        vendeur: {
            fr: "Vendeur",
            de: "Verkäufer",
        },
        voirAnnonce: {
            fr: "Voir l'annonce",
            de: "Anzeige ansehen",
        },
        cliquerIci: {
            fr: "Cliquez ici",
            de: "Hier klicken",
        },
        infoPaiement: {
            fr: "Informations de paiement",
            de: "Zahlungsinformationen",
        },
        montantAPayer: {
            fr: "Montant à payer",
            de: "Zu zahlender Betrag",
        },
        reference: {
            fr: "Référence",
            de: "Referenz",
        },
        pourFinaliser: {
            fr: "Pour finaliser votre commande, veuillez :",
            de: "Um Ihre Bestellung abzuschließen, gehen Sie bitte wie folgt vor:",
        },
        step1: {
            fr: "Télécharger le bon de commande",
            de: "Bestellschein herunterladen",
        },
        step2: {
            fr: "Effectuer le paiement sur le compte indiqué",
            de: "Zahlung auf das angegebene Konto vornehmen",
        },
        step3: {
            fr: "Valider votre commande en cliquant sur le bouton ci-dessous",
            de: "Bestätigen Sie Ihre Bestellung, indem Sie auf die Schaltfläche unten klicken",
        },
        telechargerBon: {
            fr: "Télécharger le bon de commande",
            de: "Bestellschein herunterladen",
        },
        validerCommande: {
            fr: "Valider ma commande",
            de: "Meine Bestellung bestätigen",
        },
        questions: {
            fr: "Si vous avez des questions, n'hésitez pas à nous contacter.",
            de: "Bei Fragen können Sie sich gerne an uns wenden.",
        },
        cordialement: {
            fr: "Cordialement",
            de: "Mit freundlichen Grüßen",
        },
        equipe: {
            fr: "L'équipe Steyr Tracteurs GMBH",
            de: "Das Team von Steyr Tracteurs GMBH",
        },
    },

    // Traductions pour les DEVIS (quotes)
    devis: {
        subject: {
            fr: "Réponse à votre demande de devis",
            de: "Antwort auf Ihre Angebotsanfrage",
        },
        title: {
            fr: "Réponse à votre demande de devis",
            de: "Antwort auf Ihre Angebotsanfrage",
        },
        greeting: {
            fr: "Bonjour",
            de: "Guten Tag",
        },
        intro: {
            fr: "Nous avons le plaisir de vous faire parvenir notre réponse concernant votre demande de devis pour :",
            de: "Wir freuen uns, Ihnen unsere Antwort auf Ihre Angebotsanfrage für folgendes Produkt zukommen zu lassen:",
        },
        marque: {
            fr: "Marque",
            de: "Marke",
        },
        modele: {
            fr: "Modèle",
            de: "Modell",
        },
        vendeur: {
            fr: "Vendeur",
            de: "Verkäufer",
        },
        voirAnnonce: {
            fr: "Voir l'annonce",
            de: "Anzeige ansehen",
        },
        cliquerIci: {
            fr: "Cliquez ici",
            de: "Hier klicken",
        },
        detailsDevis: {
            fr: "Détails du devis",
            de: "Angebotsdetails",
        },
        montantAPayer: {
            fr: "Montant à payer",
            de: "Zu zahlender Betrag",
        },
        pourFinaliser: {
            fr: "Pour finaliser votre commande, veuillez :",
            de: "Um Ihre Bestellung abzuschließen, gehen Sie bitte wie folgt vor:",
        },
        step1: {
            fr: "Télécharger le devis",
            de: "Angebot herunterladen",
        },
        step2: {
            fr: "Effectuer le paiement sur le compte indiqué",
            de: "Zahlung auf das angegebene Konto vornehmen",
        },
        step3: {
            fr: "Valider votre commande",
            de: "Ihre Bestellung bestätigen",
        },
        telechargerDevis: {
            fr: "Télécharger le devis",
            de: "Angebot herunterladen",
        },
        validerCommande: {
            fr: "Valider ma commande",
            de: "Meine Bestellung bestätigen",
        },
        questions: {
            fr: "Si vous avez des questions, n'hésitez pas à nous contacter.",
            de: "Bei Fragen können Sie sich gerne an uns wenden.",
        },
        cordialement: {
            fr: "Cordialement",
            de: "Mit freundlichen Grüßen",
        },
        equipe: {
            fr: "L'équipe Steyr Tracteurs GMBH",
            de: "Das Team von Steyr Tracteurs GMBH",
        },
    },
}

// Langues disponibles
const AVAILABLE_LANGUAGES = ["fr", "de"]

/**
 * Récupère une traduction pour un type d'email donné
 * @param {string} emailType - Type d'email ('order' ou 'devis')
 * @param {string} path - Chemin de la traduction (ex: 'title', 'greeting', etc.)
 * @param {string} language - Code de langue ('fr', 'de', etc.)
 * @returns {string} - Traduction trouvée, sinon fallback en français
 */
function getTranslation(emailType, path, language = "fr") {
    try {
        // Vérifier que le type d'email existe
        if (!EMAIL_TRANSLATIONS[emailType]) {
            console.warn(`[TRADUCTIONS] Type d'email inconnu: ${emailType}`)
            return `[MISSING TYPE: ${emailType}]`
        }

        // Vérifier que le chemin existe
        if (!EMAIL_TRANSLATIONS[emailType][path]) {
            console.warn(`[TRADUCTIONS] Chemin inconnu: ${emailType}.${path}`)
            return `[MISSING PATH: ${path}]`
        }

        // Récupérer la traduction dans la langue demandée
        const translation = EMAIL_TRANSLATIONS[emailType][path][language]

        // Si la traduction n'existe pas, fallback sur français
        if (!translation) {
            console.warn(`[TRADUCTIONS] Traduction manquante pour ${emailType}.${path} en ${language}, fallback sur français`)
            return EMAIL_TRANSLATIONS[emailType][path]["fr"] || `[MISSING: ${emailType}.${path}.${language}]`
        }

        return translation
    } catch (error) {
        console.error(`[TRADUCTIONS] Erreur lors de la récupération de ${emailType}.${path}.${language}:`, error)
        return `[ERROR: ${emailType}.${path}.${language}]`
    }
}

/**
 * Récupère le sujet de l'email
 * @param {string} emailType - Type d'email ('order' ou 'devis')
 * @param {string} language - Code de langue
 * @param {string} annonceTitre - Titre de l'annonce (optionnel)
 * @returns {string} - Sujet de l'email
 */
function getEmailSubject(emailType, language, annonceTitre = "") {
    const baseSubject = getTranslation(emailType, "subject", language)
    if (annonceTitre) {
        return `${baseSubject} - ${annonceTitre}`
    }
    return baseSubject
}

// Export en CommonJS pour Next.js API routes
module.exports = {
    EMAIL_TRANSLATIONS,
    AVAILABLE_LANGUAGES,
    getTranslation,
    getEmailSubject,
}
