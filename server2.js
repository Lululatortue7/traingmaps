const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const port = 5000;

app.use(cors());

// Connexion à la base de données SQLite
const openDb = async () => {
    return open({
        filename: './villes.db',
        driver: sqlite3.Database
    });
};

// Route pour obtenir les informations d'une ville
app.get('/ville/:nom', async (req, res) => {
    const { nom } = req.params;
    try {
        const db = await openDb();
        const ville = await db.get(`SELECT * FROM villes WHERE nom = ?`, nom);
        if (ville) {
            res.json(ville);
        } else {
            res.status(404).json({ error: 'Ville non trouvée' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des données de la ville' });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});
