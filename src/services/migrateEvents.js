// scripts/migrateEvents.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Event from "../src/models/Event.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/even-travel";

const migrateEvents = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connecté à MongoDB");

    const events = await Event.find({});
    console.log(`📊 Migration de ${events.length} événements...`);

    for (const event of events) {
      // Ajouter des champs par défaut
      const updates = {
        duree: event.duree || 1,
        tailleGroupeMin: event.tailleGroupeMin || 1,
        tailleGroupeMax: event.tailleGroupeMax || 20,
        difficulte: event.difficulte || "Modérée",
        langues: event.langues || ["Français"],
        servicesInclus: event.servicesInclus || [],
        servicesNonInclus: event.servicesNonInclus || [],
        momentsForts: event.momentsForts || [],
        itineraire: event.itineraire || [],
      };

      await Event.findByIdAndUpdate(event._id, updates);
      console.log(`✅ Migré: ${event.nom}`);
    }

    console.log("✅ Migration terminée avec succès");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
};

migrateEvents();