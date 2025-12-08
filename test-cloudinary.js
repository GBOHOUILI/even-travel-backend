// test-cloudinary.js – VERSION QUI MARCHE À 100%
import { v2 as cloudinary } from 'cloudinary';

(async () => {
  try {
    // TA VRAIE CONFIG
    cloudinary.config({
      cloud_name: 'duhiyjcjr',
      api_key: '277871429737892',
      api_secret: 'NoUPZX3nigSw5yxBmF90I6y5gdQ',
      secure: true,
    });

    console.log("Tentative d'upload...");

    const result = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
      {
        folder: 'even-travel/test',
        public_id: 'test-100-final-' + Date.now(),
      }
    );

    console.log("SUCCÈS TOTAL !");
    console.log("URL →", result.secure_url);
    console.log("Public ID →", result.public_id);
    console.log("Va voir ici → https://res.cloudinary.com/duhiyjcjr/image/list/even-travel.json");

  } catch (error) {
    console.error("ERREUR COMPLÈTE :");
    console.error(error); // Affiche TOUT le détail
  }
})();