// src/models/Reservation.js
import mongoose from "mongoose";

const reservationSchema = mongoose.Schema(
  {
    client: {
      nom: { type: String, required: true },
      prenom: { type: String, required: true },
      email: { type: String, required: true },
      telephone: { type: String, required: true },
    },
    type: {
      type: String,
      enum: ["destination", "event"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      refPath: "type", // ref dynamique
    },
    nombrePlaces: {
      type: Number,
      required: true,
    },
    montantTotal: {
      type: Number,
      required: true,
    },
    montantPaye: {
      type: Number,
      default: 0,
    },
    tranche: {
      type: String,
      enum: ["unique", "deux"],
      default: "unique",
    },
    statutPaiement: {
      type: String,
      enum: ["en_attente", "acompte", "paye", "annule"],
      default: "en_attente",
    },
    referencePaystack: {
      type: String,
    },
    dateReservation: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Reservation", reservationSchema);
