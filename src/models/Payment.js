import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    montant: {
      type: Number,
      required: true,
    },
    methodePaiement: {
      type: String,
      enum: ["carte", "paypal", "mtn", "moov", "autre"],
      required: true,
    },
    statut: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    details: {
      transactionId: String,
      payerEmail: String,
      payerName: String,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  },
);

// Générer une référence unique avant de sauvegarder
paymentSchema.pre("save", function (next) {
  if (!this.reference) {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    this.reference = `PAY-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.model("Payment", paymentSchema);
