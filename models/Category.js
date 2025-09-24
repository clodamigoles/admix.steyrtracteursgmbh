import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    icon: {
        public_id: {
            type: String,
            trim: true
        },
        secure_url: {
            type: String,
            trim: true
        },
        width: Number,
        height: Number,
        format: String,
        size: Number
    },
    niveau: {
        type: Number,
        required: true,
        enum: [1, 2, 3], // 1=mère, 2=fils, 3=petit-fils
        default: 1
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }
}, {
    timestamps: true
})

// Index pour optimiser les recherches
categorySchema.index({ niveau: 1, parentId: 1 })

export default mongoose.models.Category || mongoose.model('Category', categorySchema)