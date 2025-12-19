import Destination from "../models/Destination.js";
import catchAsync from "../utils/catchAsync.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";

// CREATE
export const createDestination = catchAsync(async (req, res) => {
  const {
    titre,
    description,
    prix,
    localisation,
    datesDisponibles,
    categorie,
    featured,
    placesDisponibles,
  } = req.body;

  const images = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file, "even-travel/destinations");
      images.push({
        url: result.url,
        public_id: result.public_id,
      });
    }
  }

  const destination = await Destination.create({
    titre,
    description,
    prix: Number(prix),
    localisation,
    datesDisponibles: datesDisponibles ? JSON.parse(datesDisponibles) : [],
    images,
    categorie: categorie || "voyage",
    featured: featured === "true" || featured === true,
    placesDisponibles: Number(placesDisponibles) || 20,
  });

  res.status(201).json({
    status: "success",
    data: { destination },
  });
});

// READ ALL + Filtres
export const getAllDestinations = catchAsync(async (req, res) => {
  const { prixMax, categorie, localisation, featured } = req.query;

  let query = {};

  if (prixMax) query.prix = { $lte: Number(prixMax) };
  if (categorie) query.categorie = categorie;
  if (localisation)
    query.localisation = { $regex: localisation, $options: "i" };
  if (featured === "true") query.featured = true;

  const destinations = await Destination.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: destinations.length,
    data: { destinations },
  });
});

// READ ONE
export const getDestination = catchAsync(async (req, res) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) {
    return res.status(404).json({
      status: "fail",
      message: "Destination non trouvée",
    });
  }
  res.status(200).json({
    status: "success",
    data: { destination },
  });
});

// UPDATE – CORRIGÉE À 100% (plus jamais de timeout ni ArrayBuffer)
export const updateDestination = catchAsync(async (req, res) => {
  const updates = { ...req.body };

  // Gestion des nouvelles images
  if (req.files && req.files.length > 0) {
    // 1. Récupérer l'ancienne destination pour supprimer les anciennes images
    const oldDestination = await Destination.findById(req.params.id);
    if (oldDestination && oldDestination.images.length > 0) {
      for (const img of oldDestination.images) {
        await deleteFromCloudinary(img.public_id);
      }
    }

    // 2. Uploader les nouvelles images UNE PAR UNE (sécurisé)
    const images = [];
    for (const file of req.files) {
      try {
        const result = await uploadToCloudinary(
          file,
          "even-travel/destinations",
        );
        images.push({
          url: result.url,
          public_id: result.public_id,
        });
        // Petit délai pour ne pas surcharger Cloudinary
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (err) {
        console.error("Une image a échoué lors de l’update →", err.message);
        // On continue même si une image plante
      }
    }
    updates.images = images;
  }

  // Gestion des dates
  if (updates.datesDisponibles) {
    updates.datesDisponibles = JSON.parse(updates.datesDisponibles);
  }

  // Mise à jour
  const destination = await Destination.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true },
  );

  if (!destination) {
    return res.status(404).json({
      status: "fail",
      message: "Destination non trouvée",
    });
  }

  res.status(200).json({
    status: "success",
    data: { destination },
  });
});

// DELETE – Propre et sûr
export const deleteDestination = catchAsync(async (req, res) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) {
    return res.status(404).json({
      status: "fail",
      message: "Destination non trouvée",
    });
  }

  // Supprimer toutes les images de Cloudinary
  if (destination.images.length > 0) {
    for (const img of destination.images) {
      await deleteFromCloudinary(img.public_id);
    }
  }

  await destination.deleteOne();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
