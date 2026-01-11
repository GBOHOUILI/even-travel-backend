import Reservation from "../models/Reservation.js";
import Event from "../models/Event.js";
import Destination from "../models/Destination.js";
import catchAsync from "../utils/catchAsync.js";

// @desc    Récupérer toutes les réservations (pour admin)
// @route   GET /api/v1/reservations
// @access  Private/Admin
export const getAllReservations = catchAsync(async (req, res) => {
  const reservations = await Reservation.find()
    .sort({ createdAt: -1 })
    .populate("itemId", "nom titre lieu localisation prix")
    .lean();

  res.status(200).json({
    status: "success",
    results: reservations.length,
    data: {
      reservations,
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
