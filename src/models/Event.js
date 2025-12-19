// src/models/Event.js
import mongoose from "mongoose";

const eventSchema = mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de l'événement est obligatoire"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "La date est obligatoire"],
    },
    lieu: {
      type: String,
      required: [true, "Le lieu est obligatoire"],
    },
    description: {
      type: String,
      required: [true, "La description est obligatoire"],
    },
    prix: {
      type: Number,
      required: [true, "Le prix est obligatoire"],
    },
    placesTotales: {
      type: Number,
      required: [true, "Le nombre total de places est obligatoire"],
    },
    placesRestantes: {
      type: Number,
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    categorie: {
      type: String,
      enum: ["concert", "excursion", "formation", "soiree", "culture", "autre"],
      default: "autre",
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Initialiser placesRestantes = placesTotales à la création
eventSchema.pre("save", function () {
  if (this.isNew) {
    this.placesRestantes = this.placesTotales;
  }
});

export default mongoose.model("Event", eventSchema);
