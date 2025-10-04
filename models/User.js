import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, // Suppression de l'index explicite car unique: true crée déjà un index
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Suppression de l'index explicite car unique: true crée déjà un index
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["admin", "moderator"],
      default: "admin",
    },
    lastLogin: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// userSchema.index({ username: 1 })
// userSchema.index({ email: 1 })

export default mongoose.models.User || mongoose.model("User", userSchema)