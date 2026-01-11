import Reservation from "../models/Reservation.js";
import Event from "../models/Event.js";
import Destination from "../models/Destination.js";
import catchAsync from "../utils/catchAsync.js";

// @desc    Récupérer toutes les réservations (pour admin)
// @route   GET /api/v1/reservations
// @access  Private/Admin
export const getAllReservations = catchAsync(async (req, res) => {
  // Option 1: Sans populate (simple et fonctionnel)
  const reservations = await Reservation.find().sort({ createdAt: -1 }).lean();

  // Option 2: Récupérer les détails séparément
  const populatedReservations = [];

  for (const reservation of reservations) {
    let itemDetails = null;

    if (reservation.type === "event") {
      itemDetails = await Event.findById(reservation.itemId)
        .select("nom lieu prix")
        .lean();
    } else if (reservation.type === "destination") {
      itemDetails = await Destination.findById(reservation.itemId)
        .select("titre localisation prix")
        .lean();
    }

    populatedReservations.push({
      ...reservation,
      itemDetails,
    });
  }

  res.status(200).json({
    status: "success",
    results: populatedReservations.length,
    data: {
      reservations: populatedReservations,
    },
  });
});

// @desc    Récupérer une réservation par ID
// @route   GET /api/v1/reservations/:id
// @access  Private/Admin
export const getReservationById = catchAsync(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate("itemId", "nom titre lieu localisation prix description")
    .lean();

  if (!reservation) {
    return res.status(404).json({
      status: "fail",
      message: "Réservation non trouvée",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      reservation,
    },
  });
});

// @desc    Mettre à jour le statut d'une réservation
// @route   PATCH /api/v1/reservations/:id/status
// @access  Private/Admin
export const updateReservationStatus = catchAsync(async (req, res) => {
  const { statutPaiement } = req.body;

  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return res.status(404).json({
      status: "fail",
      message: "Réservation non trouvée",
    });
  }

  // Mettre à jour le statut
  reservation.statutPaiement = statutPaiement;

  // Si le statut passe à "paye", mettre à jour les places disponibles pour les événements
  if (statutPaiement === "paye" && reservation.type === "event") {
    await Event.findByIdAndUpdate(reservation.itemId, {
      $inc: { placesRestantes: -reservation.nombrePlaces },
    });
  }

  // Si le statut passe à "annule", remettre les places si c'était payé
  if (
    statutPaiement === "annule" &&
    reservation.statutPaiement === "paye" &&
    reservation.type === "event"
  ) {
    await Event.findByIdAndUpdate(reservation.itemId, {
      $inc: { placesRestantes: reservation.nombrePlaces },
    });
  }

  await reservation.save();

  res.status(200).json({
    status: "success",
    data: {
      reservation,
    },
  });
});

// @desc    Supprimer une réservation
// @route   DELETE /api/v1/reservations/:id
// @access  Private/Admin
export const deleteReservation = catchAsync(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return res.status(404).json({
      status: "fail",
      message: "Réservation non trouvée",
    });
  }

  // Si la réservation était payée, remettre les places
  if (reservation.statutPaiement === "paye" && reservation.type === "event") {
    await Event.findByIdAndUpdate(reservation.itemId, {
      $inc: { placesRestantes: reservation.nombrePlaces },
    });
  }

  await reservation.deleteOne();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// @desc    Récupérer les statistiques des réservations
// @route   GET /api/v1/reservations/stats
// @access  Private/Admin
export const getReservationStats = catchAsync(async (req, res) => {
  const stats = await Reservation.aggregate([
    {
      $group: {
        _id: null,
        totalReservations: { $sum: 1 },
        totalRevenue: { $sum: "$montantTotal" },
        totalPaid: { $sum: "$montantPaye" },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$statutPaiement", "en_attente"] }, 1, 0] },
        },
        paidCount: {
          $sum: { $cond: [{ $eq: ["$statutPaiement", "paye"] }, 1, 0] },
        },
        depositCount: {
          $sum: { $cond: [{ $eq: ["$statutPaiement", "acompte"] }, 1, 0] },
        },
        cancelledCount: {
          $sum: { $cond: [{ $eq: ["$statutPaiement", "annule"] }, 1, 0] },
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats: stats[0] || {
        totalReservations: 0,
        totalRevenue: 0,
        totalPaid: 0,
        pendingCount: 0,
        paidCount: 0,
        depositCount: 0,
        cancelledCount: 0,
      },
    },
  });
});

// @desc    Créer une nouvelle réservation
// @route   POST /api/v1/reservations
// @access  Public
export const createReservation = catchAsync(async (req, res) => {
  const {
    client,
    type,
    itemId,
    date,
    nombrePlaces,
    message,
    tranche = "unique",
    methodePaiement,
  } = req.body;

  // Vérifier si l'élément (event ou destination) existe
  let item;
  let prixUnitaire;

  if (type === "event") {
    item = await Event.findById(itemId);
    if (!item) {
      return res.status(404).json({
        status: "fail",
        message: "Événement non trouvé",
      });
    }
    prixUnitaire = item.prix || 0;

    // Vérifier les places disponibles
    if (
      item.placesRestantes !== undefined &&
      item.placesRestantes < nombrePlaces
    ) {
      return res.status(400).json({
        status: "fail",
        message: `Il ne reste que ${item.placesRestantes} places disponibles`,
      });
    }
  } else if (type === "destination") {
    item = await Destination.findById(itemId);
    if (!item) {
      return res.status(404).json({
        status: "fail",
        message: "Destination non trouvée",
      });
    }
    prixUnitaire = item.prix || 0;

    // Vérifier les places disponibles pour les destinations
    if (
      item.placesDisponibles !== undefined &&
      item.placesDisponibles < nombrePlaces
    ) {
      return res.status(400).json({
        status: "fail",
        message: `Il ne reste que ${item.placesDisponibles} places disponibles`,
      });
    }
  } else {
    return res.status(400).json({
      status: "fail",
      message: "Type de réservation invalide",
    });
  }

  // Calculer le montant total
  const montantTotal = prixUnitaire * nombrePlaces;

  // Calculer le montant à payer selon le type de tranche
  let montantPaye = 0;
  if (tranche === "deux") {
    montantPaye = Math.ceil(montantTotal / 2);
  } else {
    montantPaye = montantTotal;
  }

  // Créer la réservation
  const reservation = await Reservation.create({
    client: {
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
    },
    type,
    itemId,
    date: new Date(date),
    nombrePlaces,
    message,
    tranche,
    montantTotal,
    montantPaye,
    statutPaiement: "en_attente", // Statut initial
  });

  res.status(201).json({
    status: "success",
    data: {
      reservation,
    },
    message: "Réservation créée avec succès",
  });
});

// @desc    Initier un paiement pour une réservation
// @route   POST /api/v1/reservations/initier
// @access  Public
export const initPayment = catchAsync(async (req, res) => {
  const {
    client,
    type,
    itemId,
    date,
    nombrePlaces,
    message,
    planPaiement,
    methodePaiement,
  } = req.body;

  // Vérifier les données requises
  if (!client || !type || !itemId || !date || !nombrePlaces) {
    return res.status(400).json({
      status: "fail",
      message: "Données de réservation incomplètes",
    });
  }

  // Calculer le prix unitaire
  let prixUnitaire = 0;
  let itemName = "";
  let itemLocation = "";

  if (type === "event") {
    const event = await Event.findById(itemId);
    if (!event) {
      return res.status(404).json({
        status: "fail",
        message: "Événement non trouvé",
      });
    }
    prixUnitaire = event.prix || 0;
    itemName = event.nom;
    itemLocation = event.lieu;
  } else if (type === "destination") {
    const destination = await Destination.findById(itemId);
    if (!destination) {
      return res.status(404).json({
        status: "fail",
        message: "Destination non trouvée",
      });
    }
    prixUnitaire = destination.prix || 0;
    itemName = destination.titre;
    itemLocation = destination.localisation;
  }

  // Calculer les montants
  const montantTotal = prixUnitaire * nombrePlaces;

  // Déterminer la tranche
  const tranche = planPaiement === "deux_tranches" ? "deux" : "unique";

  // Calculer le montant à payer maintenant
  let montantPaye = 0;
  if (tranche === "deux") {
    montantPaye = Math.ceil(montantTotal / 2);
  } else {
    montantPaye = montantTotal;
  }

  // Créer la réservation temporaire
  const reservation = await Reservation.create({
    client: {
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
    },
    type,
    itemId,
    date: new Date(date),
    nombrePlaces,
    message,
    tranche,
    montantTotal,
    montantPaye,
    statutPaiement: "en_attente",
  });

  // Générer l'URL de paiement (simulation)
  let paymentUrl = "";
  const reservationId = reservation._id.toString();

  // Selon la méthode de paiement choisie
  switch (methodePaiement) {
    case "carte":
    case "paypal":
    case "mtn":
    case "moov":
    default:
      // Pour tous les types, rediriger vers votre page de paiement interne
      paymentUrl = `/paiement.html?id=${reservationId}`;
      break;
  }

  // Mettre à jour la réservation avec l'URL de paiement
  reservation.paymentUrl = paymentUrl;
  await reservation.save();

  res.status(200).json({
    status: "success",
    data: {
      reservation: {
        _id: reservation._id,
        montantTotal,
        montantPaye,
        paymentUrl,
        itemName,
        itemLocation,
        date: reservation.date,
        nombrePlaces,
      },
    },
    message: "Paiement initialisé avec succès",
  });
});
