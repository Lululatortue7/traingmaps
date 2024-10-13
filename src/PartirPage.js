import React, { useState } from 'react';
import Map from './components/Map';
import trainIcon from './assets/train-icon.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlidersH } from '@fortawesome/free-solid-svg-icons';
import FilterPopup from './components/FilterPopup'; // Importer le pop-up depuis un fichier séparé

function PartirPage() {
  const [startCity, setStartCity] = useState('');
  const [submittedStartCity, setSubmittedStartCity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilters, setShowFilters] = useState(false); // Gérer l'état pour afficher ou non le pop-up

  // États pour les nouveaux filtres
  const [isBeach, setIsBeach] = useState(false);
  const [isMountain, setIsMountain] = useState(false);
  const [isCapital, setIsCapital] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedStartCity(startCity);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters); // Alterner l'état pour afficher/masquer le pop-up
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Voyager en train à travers l'Europe et le monde n'a jamais été aussi facile</h1>
      </header>

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

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              placeholder="JJ/MM/AAAA"
            />
          </div>

          <div className="icon">
            <img src={trainIcon} alt="train icon" />
          </div>

          <button className="cta-button" type="submit">C'est parti !</button>

          {/* Bouton pour ouvrir le filtre */}
          <button className="filter-button" type="button" onClick={toggleFilters}>
            <FontAwesomeIcon icon={faSlidersH} />
          </button>
        </form>
      </div>

      {/* Affichage conditionnel du pop-up de filtre */}
      {showFilters && (
        <FilterPopup 
          toggleFilters={toggleFilters}
          isBeach={isBeach}
          setIsBeach={setIsBeach}
          isMountain={isMountain}
          setIsMountain={setIsMountain}
          isCapital={isCapital}
          setIsCapital={setIsCapital}
        />
      )}

      {/* Carte */}
      <Map startCity={submittedStartCity} endCity="" />
    </div>
  );
}

export default PartirPage;
