import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    client: {
      nom: { type: String, required: true },
      prenom: { type: String, required: true },
      email: { type: String, required: true },
      telephone: { type: String, required: true },
    },
    type: {
      type: String,
      enum: ["event", "destination"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "type",
    },
    date: { type: Date, required: true },
    nombrePlaces: { type: Number, required: true, min: 1 },
    message: String,

    // Informations de paiement
    tranche: {
      type: String,
      enum: ["unique", "deux"],
      default: "unique",
    },

    // Statuts
    montantTotal: { type: Number, required: true },
    montantPaye: { type: Number, default: 0 },
    statutPaiement: {
      type: String,
      enum: ["en_attente", "acompte", "paye", "annule"],
      default: "en_attente",
    },

    // Informations transaction
    transactionId: String,
    paymentUrl: String,
  },
  {
    timestamps: true,
  },
);

// Référence dynamique
reservationSchema.virtual("item", {
  ref: function () {
    return this.type === "event" ? "Event" : "Destination";
  },
  localField: "itemId",
  foreignField: "_id",
  justOne: true,
});

export default mongoose.model("Reservation", reservationSchema);
