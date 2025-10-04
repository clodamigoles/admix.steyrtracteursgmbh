import mongoose from 'mongoose'

const appInfosSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Accepte tout type de valeur
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['banking', 'company', 'technical', 'settings', 'social', 'other'],
        default: 'other'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

// Index pour optimiser les recherches
appInfosSchema.index({ key: 1, isActive: 1 })
appInfosSchema.index({ category: 1 })

// Méthode statique pour récupérer une valeur par clé
appInfosSchema.statics.getValue = async function(key) {
    const appInfo = await this.findOne({ key, isActive: true })
    return appInfo ? appInfo.value : null
}

// Méthode statique pour définir/mettre à jour une valeur
appInfosSchema.statics.setValue = async function(key, value, description = '', category = 'other') {
    const appInfo = await this.findOneAndUpdate(
        { key },
        { value, description, category, isActive: true },
        { new: true, upsert: true, runValidators: true }
    )
    return appInfo
}

// Méthode statique pour récupérer toutes les valeurs par catégorie
appInfosSchema.statics.getByCategory = async function(category) {
    const appInfos = await this.find({ category, isActive: true })
    
    // Convertir en objet key-value
    const result = {}
    appInfos.forEach(info => {
        result[info.key] = info.value
    })
    
    return result
}

// Méthode statique pour récupérer toutes les infos
appInfosSchema.statics.getAll = async function() {
    const appInfos = await this.find({ isActive: true })
    
    // Convertir en objet key-value
    const result = {}
    appInfos.forEach(info => {
        result[info.key] = info.value
    })
    
    return result
}

export const AppInfos = mongoose.models.AppInfos || mongoose.model('AppInfos', appInfosSchema)