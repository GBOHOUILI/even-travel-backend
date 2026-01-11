import Payment from "../models/Payment.js";
import Reservation from "../models/Reservation.js";
import catchAsync from "../utils/catchAsync.js";

// @desc    Récupérer tous les paiements
// @route   GET /api/v1/payments
// @access  Private/Admin
export const getAllPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "reservation",
      populate: {
        path: "itemId",
        select: "nom titre lieu localisation prix",
      },
    })
    .lean();

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: {
      payments,
    },
  });
});

// @desc    Récupérer un paiement par ID
// @route   GET /api/v1/payments/:id
// @access  Private/Admin
export const getPaymentById = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate({
      path: "reservation",
      populate: {
        path: "itemId",
        select: "nom titre lieu localisation prix description",
      },
    })
    .lean();

  if (!payment) {
    return res.status(404).json({
      status: "fail",
      message: "Paiement non trouvé",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      payment,
    },
  });
});

// @desc    Mettre à jour le statut d'un paiement
// @route   PATCH /api/v1/payments/:id/status
// @access  Private/Admin
export const updatePaymentStatus = catchAsync(async (req, res) => {
  const { statut } = req.body;

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return res.status(404).json({
      status: "fail",
      message: "Paiement non trouvé",
    });
  }

  payment.statut = statut;
  await payment.save();

  // Si le paiement est marqué comme payé, mettre à jour la réservation
  if (statut === "paid" && payment.reservation) {
    await Reservation.findByIdAndUpdate(payment.reservation, {
      statutPaiement: "paye",
      montantPaye: payment.montant,
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      payment,
    },
  });
});

// @desc    Supprimer un paiement
// @route   DELETE /api/v1/payments/:id
// @access  Private/Admin
export const deletePayment = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return res.status(404).json({
      status: "fail",
      message: "Paiement non trouvé",
    });
  }

  await payment.deleteOne();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// @desc    Récupérer les statistiques des paiements
// @route   GET /api/v1/payments/stats
// @access  Private/Admin
export const getPaymentStats = catchAsync(async (req, res) => {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: "$montant" },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ["$statut", "pending"] }, "$montant", 0] },
        },
        paidAmount: {
          $sum: { $cond: [{ $eq: ["$statut", "paid"] }, "$montant", 0] },
        },
        cancelledAmount: {
          $sum: { $cond: [{ $eq: ["$statut", "cancelled"] }, "$montant", 0] },
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats: stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        cancelledAmount: 0,
      },
    },
  });
});
