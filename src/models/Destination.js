import mongoose from 'mongoose';

const destinationSchema = mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    prix: {
      type: Number,
      required: true,
    },
    localisation: {
      type: String,
      required: true,
    },
    datesDisponibles: [
      {
        debut: { type: Date, required: true },
        fin: { type: Date, required: true },
      },
    ],
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    categorie: {
      type: String,
      enum: ['voyage', 'weekend', 'culture', 'aventure', 'famille'],
      default: 'voyage',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    placesDisponibles: {
      type: Number,
      default: 50,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Destination', destinationSchema);