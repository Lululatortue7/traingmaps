import React, { useState } from 'react';
import Map from './components/Map'; // N'oublie pas d'importer le composant Map si nécessaire
import trainIcon from './assets/train-icon.png'; // Assurez-vous que l'icône du train est bien importée

function PartirPage() {
  const [startCity, setStartCity] = useState('');
  const [submittedStartCity, setSubmittedStartCity] = useState('');
  const [showNightTrains, setShowNightTrains] = useState(false); // Nouvel état pour la case à cocher

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedStartCity(startCity);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Voyager en train à travers l'Europe et le monde n'a jamais été aussi facile</h1>
      </header>

      {/* Section avec le formulaire pour la ville de départ */}
      <div className="form-section">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="depart">Ville de départ</label>
            <input
              type="text"
              id="depart"
              placeholder="Ville de départ"
              value={startCity}
              onChange={(e) => setStartCity(e.target.value)}
            />
          </div>

          {/* Ajout de la case à cocher pour les trains de nuit */}
          <div className="form-group">
            <input
              type="checkbox"
              id="night-trains"
              checked={showNightTrains}
              onChange={(e) => setShowNightTrains(e.target.checked)}
            />
            <label htmlFor="night-trains">Voir seulement les trains de nuits</label>
          </div>

          {/* Icône de train */}
          <div className="icon">
            <img src={trainIcon} alt="train icon" />
          </div>

          {/* Bouton pour soumettre la recherche */}
          <button className="cta-button" type="submit">C'est parti !</button>
        </form>
      </div>

      {/* Carte qui s'affiche après soumission */}
      <Map startCity={submittedStartCity} endCity="" /> {/* endCity est vide pour cette page */}
    </div>
  );
}

export default PartirPage;



