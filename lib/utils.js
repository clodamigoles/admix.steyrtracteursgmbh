import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Fonction pour combiner les classes CSS (utilisée par shadcn/ui)
export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

// Fonction pour formater les dates
export function formatDate(date, options = {}) {
    if (!date) return ""

    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return ""

    const defaultOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    }

    return dateObj.toLocaleDateString("fr-FR", defaultOptions)
}

// Fonction pour formater les dates courtes
export function formatDateShort(date) {
    return formatDate(date, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

// Fonction pour formater les prix
export function formatPrice(price, currency = "EUR", locale = "fr-FR") {
    if (price === null || price === undefined || isNaN(price)) return ""

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(price)
}

// Fonction pour formater les nombres
export function formatNumber(number, locale = "fr-FR") {
    if (number === null || number === undefined || isNaN(number)) return ""

    return new Intl.NumberFormat(locale).format(number)
}

// Fonction pour capitaliser la première lettre
export function capitalize(str) {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Fonction pour tronquer le texte
export function truncate(str, length = 100) {
    if (!str) return ""
    if (str.length <= length) return str
    return str.substring(0, length) + "..."
}

// Fonction pour valider l'email
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Fonction pour valider le téléphone français
export function isValidPhoneFR(phone) {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
    return phoneRegex.test(phone)
}

// Fonction pour formater le téléphone
export function formatPhone(phone) {
    if (!phone) return ""
    // Supprime tous les caractères non numériques sauf le +
    const cleaned = phone.replace(/[^\d+]/g, "")

    // Format français
    if (cleaned.startsWith("+33")) {
        const number = cleaned.substring(3)
        return `+33 ${number.substring(0, 1)} ${number.substring(1, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7, 9)}`
    } else if (cleaned.startsWith("0")) {
        return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`
    }

    return phone
}

// Fonction pour générer un slug
export function generateSlug(text) {
    if (!text) return ""

    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
        .replace(/[^a-z0-9\s-]/g, "") // Supprime les caractères spéciaux
        .replace(/\s+/g, "-") // Remplace les espaces par des tirets
        .replace(/-+/g, "-") // Supprime les tirets multiples
        .trim("-") // Supprime les tirets en début/fin
}

// Fonction pour calculer le temps écoulé
export function timeAgo(date, locale = "fr-FR") {
    if (!date) return ""

    const now = new Date()
    const past = new Date(date)
    const diffInSeconds = Math.floor((now - past) / 1000)

    const intervals = {
        année: 31536000,
        mois: 2592000,
        semaine: 604800,
        jour: 86400,
        heure: 3600,
        minute: 60,
    }

    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(diffInSeconds / seconds)
        if (interval >= 1) {
            return `Il y a ${interval} ${unit}${interval > 1 ? "s" : ""}`
        }
    }

    return "À l'instant"
}

// Fonction pour débouncer
export function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// Fonction pour copier dans le presse-papiers
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (err) {
        // Fallback pour les navigateurs plus anciens
        const textArea = document.createElement("textarea")
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
            document.execCommand("copy")
            document.body.removeChild(textArea)
            return true
        } catch (err) {
            document.body.removeChild(textArea)
            return false
        }
    }
}

// Fonction pour générer un ID unique
export function generateId(prefix = "") {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 8)
    return prefix ? `${prefix}_${timestamp}_${randomStr}` : `${timestamp}_${randomStr}`
}

// Fonction pour vérifier si un objet est vide
export function isEmpty(obj) {
    if (obj === null || obj === undefined) return true
    if (Array.isArray(obj)) return obj.length === 0
    if (typeof obj === "object") return Object.keys(obj).length === 0
    if (typeof obj === "string") return obj.trim().length === 0
    return false
}

// Fonction pour deep clone
export function deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map((item) => deepClone(item))
    if (typeof obj === "object") {
        const clonedObj = {}
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key])
            }
        }
        return clonedObj
    }
}
