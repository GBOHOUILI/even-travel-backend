import Event from "../models/Event.js";
import catchAsync from "../utils/catchAsync.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";

// CREATE
export const createEvent = catchAsync(async (req, res) => {
  const {
    nom,
    date,
    lieu,
    description,
    prix,
    placesTotales,
    categorie,
    featured,
  } = req.body;

  const images = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file, "even-travel/events");
      images.push({
        url: result.url,
        public_id: result.public_id,
      });
    }
  }

  const event = await Event.create({
    nom,
    date,
    lieu,
    description,
    prix: Number(prix),
    placesTotales: Number(placesTotales),
    placesRestantes: Number(placesTotales),
    images,
    categorie: categorie || "autre",
    featured: featured === "true" || featured === true,
  });

  res.status(201).json({
    status: "success",
    data: { event },
  });
});

// READ ALL + filtre upcoming
export const getAllEvents = catchAsync(async (req, res) => {
  const { upcoming, categorie } = req.query;

  let query = {};

  if (upcoming === "true") {
    query.date = { $gte: new Date() };
  }
  if (categorie) {
    query.categorie = categorie;
  }

  const events = await Event.find(query).sort({ date: 1 });

  res.status(200).json({
    status: "success",
    results: events.length,
    data: { events },
  });
});

// READ ONE
export const getEvent = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res
      .status(404)
      .json({ status: "fail", message: "Événement non trouvé" });
  }
  res.status(200).json({
    status: "success",
    data: { event },
  });
});

// UPDATE
export const updateEvent = catchAsync(async (req, res) => {
  const updates = { ...req.body };

  if (req.files && req.files.length > 0) {
    const oldEvent = await Event.findById(req.params.id);
    if (oldEvent && oldEvent.images.length > 0) {
      for (const img of oldEvent.images) {
        await deleteFromCloudinary(img.public_id);
      }
    }

    const images = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file, "even-travel/events");
      images.push({
        url: result.url,
        public_id: result.public_id,
      });
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    updates.images = images;
  }

  const event = await Event.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!event) {
    return res
      .status(404)
      .json({ status: "fail", message: "Événement non trouvé" });
  }

  res.status(200).json({
    status: "success",
    data: { event },
  });
});

// DELETE
export const deleteEvent = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res
      .status(404)
      .json({ status: "fail", message: "Événement non trouvé" });
  }

  if (event.images.length > 0) {
    for (const img of event.images) {
      await deleteFromCloudinary(img.public_id);
    }
  }

  await event.deleteOne();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
