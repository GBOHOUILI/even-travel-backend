import Reservation from "../models/Reservation.js";
import Destination from "../models/Destination.js";
import Event from "../models/Event.js";
import catchAsync from "../utils/catchAsync.js";

// Créer réservation + générer lien KkiaPay
export const initierPaiement = catchAsync(async (req, res) => {
  const { type, itemId, nombrePlaces, tranche, client } = req.body;

  let item;
  let prixUnitaire;

  if (type === "destination") {
    item = await Destination.findById(itemId);
    prixUnitaire = item.prix;
  } else if (type === "event") {
    item = await Event.findById(itemId);
    prixUnitaire = item.prix;

    if (item.placesRestantes < nombrePlaces) {
      return res.status(400).json({
        status: "fail",
        message: "Plus assez de places disponibles",
      });
    }
  }

  if (!item) {
    return res.status(404).json({ status: "fail", message: "Item non trouvé" });
  }

  const montantTotal = prixUnitaire * nombrePlaces;
  const montantAPayer =
    tranche === "deux" ? Math.ceil(montantTotal / 2) : montantTotal;

  // Créer la réservation en attente
  const reservation = await Reservation.create({
    client,
    type,
    itemId,
    nombrePlaces,
    montantTotal,
    montantPaye: 0,
    tranche,
    statutPaiement: "en_attente",
  });

  // Générer le lien de paiement KkiaPay
  const paymentData = {
    amount: montantAPayer,
    phone: client.telephone,
    email: client.email,
    name: `${client.prenom} ${client.nom}`,
    reason: `Réservation ${type} - Even Travel`,
    data: JSON.stringify({
      reservation_id: reservation._id.toString(),
      tranche,
    }),
    sandbox: process.env.KKIAPAY_SANDBOX === "true",
  };

  res.status(200).json({
    status: "success",
    data: {
      reservation,
      payment: paymentData,
      publicKey: process.env.KKIAPAY_PUBLIC_KEY,
      message: "Utilise le widget KkiaPay côté frontend avec ces données",
    },
  });
});

// Webhook KkiaPay (vérification paiement)
export const webhookKkiaPay = catchAsync(async (req, res) => {
  const event = req.body;

  // Vérifier signature (optionnel mais recommandé)
  // KkiaPay envoie "transaction_id", "status", "amount", etc.

  if (event.status === "SUCCESS") {
    const reservationId = JSON.parse(event.data).reservation_id;

    const reservation = await Reservation.findById(reservationId);
    if (reservation && reservation.statutPaiement !== "paye") {
      const montantPaye = Number(event.amount);

      reservation.montantPaye += montantPaye;

      if (reservation.montantPaye >= reservation.montantTotal) {
        reservation.statutPaiement = "paye";
      } else {
        reservation.statutPaiement = "acompte";
      }

      await reservation.save();

      // Réduire les places pour événement
      if (reservation.type === "event") {
        await Event.findByIdAndUpdate(reservation.itemId, {
          $inc: { placesRestantes: -reservation.nombrePlaces },
        });
      }

      // TODO : envoyer email confirmation
      console.log(`Paiement réussi pour réservation ${reservationId}`);
    }
  }

  res.status(200).send("OK");
});
