import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';

// Connexion à la base de données SQLite
const db = await open({
  filename: './villes.db',
  driver: sqlite3.Database
});

// Fonction pour récupérer les informations d'une ville via l'API Wikimedia
const fetchCityData = async (city) => {
  try {
    // API Wikimedia pour la description
    const response = await fetch(`https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${city}&origin=*&exintro=true&explaintext=true`);
    const data = await response.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0];
    const description = page.extract || `Pourquoi visiter ${city} ?`;

    // Ajouter la ville à la base de données sans image
    await db.run(`INSERT INTO villes (nom, pourquoi_visiter, que_voir, fun_fact) VALUES (?, ?, ?, ?)`, [
      city,
      description,  // Utilise la description de Wikipédia pour "Pourquoi visiter"
      `Que voir à ${city} ?`,  // Placeholder pour "Que voir"
      `Le saviez-vous ?`  // Placeholder pour "Fun fact"
    ]);

    console.log(`Ville ${city} ajoutée avec succès`);
  } catch (error) {
    console.error(`Erreur lors de l'ajout de la ville ${city}:`, error);
  }
};

// Fonction pour lire la liste des villes depuis le fichier CSV et les ajouter à la base de données
const populateDatabase = async () => {
  const csvData = await fs.readFile('villes-touristiques/villes.csv', 'utf8');
  const villes = csvData.split('\n').map(line => line.trim()).filter(line => line);

  for (const ville of villes) {
    await fetchCityData(ville);
  }
  console.log('Base de données remplie avec succès.');
};

// Lancer le remplissage de la base de données
populateDatabase().catch(console.error);
node villes-touristiques/populate_db.js
