import React, { useState } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import Map from './components/Map';

function App() {
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');
  const [submittedStartCity, setSubmittedStartCity] = useState('');
  const [submittedEndCity, setSubmittedEndCity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedStartCity(startCity);
    setSubmittedEndCity(endCity);
  };

  return (
    <div className="container">
      {/* Bandeau bleu */}
      <header className="header">
        <h1>Voyager en train à travers l'Europe et le monde n'a jamais été aussi facile</h1>
      </header>

      {/* Section du formulaire avec fond rose */}
      <div className="form-section">
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

        <div className="icon">
          <img src={require('./assets/train-icon.png')} alt="Train Icon" />
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

        {/* Bouton "C'est parti !" */}
        <button className="cta-button" onClick={handleSubmit}>C'est parti !</button>
      </div>

      {/* Carte au centre */}
      <Map startCity={submittedStartCity} endCity={submittedEndCity} />
    </div>
  );
}

export default App;

