import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { promises as fs } from 'fs';

// Connexion à la base de données
const db = new sqlite3.Database('./villes.db', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err.message);
        return;
    }
    console.log('Connexion à la base de données SQLite réussie.');
});

// Création de la table "villes"
db.run(`CREATE TABLE IF NOT EXISTS villes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    image_url TEXT,
    pourquoi_visiter TEXT,
    que_voir TEXT,
    fun_fact TEXT
)`, (err) => {
    if (err) {
        return console.error('Erreur lors de la création de la table:', err.message);
    }
    console.log("Table 'villes' créée avec succès.");
});

// Fermer la base de données après création
db.close((err) => {
    if (err) {
        return console.error('Erreur lors de la fermeture de la base de données:', err.message);
    }
    console.log("Base de données et table 'villes' créées et fermées avec succès.");
});
