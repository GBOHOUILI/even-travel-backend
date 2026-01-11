import Reservation from "../models/Reservation.js";
import catchAsync from "../utils/catchAsync.js";
import axios from "axios";

// Initier paiement Flutterwave
export const initierPaiementFlutterwave = catchAsync(async (req, res) => {
  const { client, type, itemId, nombrePlaces, planPaiement, methodePaiement } =
    req.body;

  // Récupérer l'item (événement ou destination)
  const Item = type === "evenement" ? Event : Destination;
  const item = await Item.findById(itemId);

  if (!item) {
    return res.status(404).json({
      status: "fail",
      message: "Item non trouvé",
    });
  }

  // Calculer le montant
  const montantTotal = item.prix * nombrePlaces;
  const montantAPayer =
    planPaiement === "deux_tranches"
      ? Math.ceil(montantTotal / 2)
      : montantTotal;

  // Créer la réservation
  const reservation = await Reservation.create({
    client,
    type,
    itemId,
    date: req.body.date,
    nombrePlaces,
    message: req.body.message,
    planPaiement,
    methodePaiement,
    montantTotal,
    montantPaye: 0,
    statutPaiement: "en_attente",
  });

  // Générer une référence unique
  const transactionId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Données pour Flutterwave
  const paymentData = {
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: transactionId,
    amount: montantAPayer,
    currency: "XOF",
    payment_options: "card, mobilemoney, ussd",
    customer: {
      email: client.email,
      phone_number: client.telephone,
      name: `${client.prenom} ${client.nom}`,
    },
    customizations: {
      title: "Even Travel",
      description: `Réservation ${type} - ${item.nom}`,
      logo: "https://votre-site.com/logo.png",
    },
    meta: {
      reservationId: reservation._id.toString(),
      type,
      planPaiement,
    },
  };

  // Sauvegarder l'ID de transaction
  reservation.transactionId = transactionId;
  await reservation.save();

  res.status(200).json({
    status: "success",
    data: {
      reservation,
      paymentData,
      message: "Redirigez l'utilisateur vers Flutterwave",
    },
  });
});

// Webhook Flutterwave
export const webhookFlutterwave = catchAsync(async (req, res) => {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers["verif-hash"];

  // Vérifier la signature
  if (signature !== secretHash) {
    return res.status(401).send("Unauthorized");
  }

  const event = req.body;

  if (event.status === "successful") {
    const reservationId = event.meta.reservationId;

    const reservation = await Reservation.findById(reservationId);
    if (reservation && reservation.statutPaiement !== "paye") {
      const montantPaye = Number(event.amount);

      reservation.montantPaye += montantPaye;
      reservation.statutPaiement =
        montantPaye >= reservation.montantTotal ? "paye" : "acompte";

      await reservation.save();

      // Réduire les places pour les événements
      if (reservation.type === "evenement") {
        await Event.findByIdAndUpdate(reservation.itemId, {
          $inc: { placesRestantes: -reservation.nombrePlaces },
        });
      }

      // TODO: Envoyer email de confirmation
      console.log(`Paiement réussi pour réservation ${reservationId}`);
    }
  }

  res.status(200).send("OK");
});

// Vérifier statut paiement
export const verifierPaiement = catchAsync(async (req, res) => {
  const { transactionId } = req.body;

  try {
    // Vérifier auprès de Flutterwave
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      },
    );

    const transaction = response.data.data;

    if (transaction.status === "successful") {
      // Mettre à jour la réservation
      const reservation = await Reservation.findOne({ transactionId });

      if (reservation) {
        reservation.statutPaiement = "paye";
        reservation.montantPaye = transaction.amount;
        await reservation.save();

        return res.status(200).json({
          status: "success",
          message: "Paiement confirmé",
        });
      }
    }

    res.status(400).json({
      status: "fail",
      message: "Paiement non confirmé",
    });
  } catch (error) {
    console.error("Erreur vérification:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la vérification",
    });
  }
});
