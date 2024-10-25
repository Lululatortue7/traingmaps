import React, { useState } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import Map from './components/Map';
import PartirPage from './PartirPage'; // Import de la page "Où partir"
import trainIcon from './assets/train-icon.png'; // Icône du train


function App() {
  const [currentPage, setCurrentPage] = useState('escale'); // État pour suivre la page active
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');
  const [submittedStartCity, setSubmittedStartCity] = useState('');
  const [submittedEndCity, setSubmittedEndCity] = useState('');
  const [showGare, setShowGare] = useState(false); // État pour afficher l'animation

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedStartCity(startCity);
    setSubmittedEndCity(endCity);
  };

  const changePageWithAnimation = (page) => {
    setShowGare(true); // Affiche l'image de la gare

    setTimeout(() => {
      setShowGare(false); // Cache l'image de la gare après l'animation
      setCurrentPage(page); // Change de page
    }, 1500); // Délai correspondant à la durée de l'animation
  };

  const renderPage = () => {
    if (currentPage === 'escale') {
      return (
        <div className="container">
          <header className="header">
            <h1>Voyager en train à travers l'Europe et le monde n'a jamais été aussi facile</h1>
          </header>

          {/* Section avec le formulaire pour la ville de départ et destination */}
          <div className="form-section">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="depart">Départ</label>
                <input
                  type="text"
                  id="depart"
                  placeholder="Ville de départ"
                  value={startCity}
                  onChange={(e) => setStartCity(e.target.value)}
                />
              </div>

              {/* Icône de train entre départ et destination */}
              <div className="icon">
                <img src={trainIcon} alt="train icon" />
              </div>

              <div className="form-group">
                <label htmlFor="destination">Destination</label>
                <input
                  type="text"
                  id="destination"
                  placeholder="Ville de destination"
                  value={endCity}
                  onChange={(e) => setEndCity(e.target.value)}
                />
              </div>

              <button className="cta-button" type="submit">C'est parti !</button>
            </form>
          </div>

          {/* Carte qui s'affiche après soumission */}
          <Map startCity={submittedStartCity} endCity={submittedEndCity} />
        </div>
      );
    } else if (currentPage === 'partir') {
      return <PartirPage />;
    }
  };

  return (
    <div className="app">
      {/* Conteneur des boutons en haut */}
      <div className="header-buttons-container">
        {/* Bouton "Où faire une escale" avec style conditionnel */}
        <button
          className={`header-button ${currentPage === 'escale' ? 'active-button' : ''}`}
          onClick={() => changePageWithAnimation('escale')}
        >
          Où faire une escale
        </button>

        {/* Bouton "Où partir" avec style conditionnel */}
        <button
          className={`header-button ${currentPage === 'partir' ? 'active-button' : ''}`}
          onClick={() => changePageWithAnimation('partir')}
        >
          Où partir
        </button>
      </div>

      {/* Affichage de la page */}
      {renderPage()}

      {/* Affichage de l'animation de la gare */}
      {showGare && (
        <div className="gare-overlay">
          <div className="gare-image gare-animation"></div>
        </div>
      )}
    </div>
  );
}

export default App;
