import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/Modal.css';

// Clé API Unsplash (remplace par la tienne)
const UNSPLASH_API_KEY = 'BQ7R5EW5Azm3jvfZOdvZo8xuFskHYB-FpGTgT9mJKu4';

// Fonction pour récupérer les coordonnées des villes
const fetchCoordinates = async (city) => {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`);
  const data = await response.json();
  if (data && data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } else {
    console.error(`Impossible de trouver des coordonnées pour ${city}`);
    return null;
  }
};

// Fonction pour récupérer une image de la ville via l'API Unsplash
const fetchCityImage = async (city) => {
  const response = await fetch(`https://api.unsplash.com/search/photos?query=${city}&client_id=${UNSPLASH_API_KEY}`);
  const data = await response.json();

  if (data && data.results && data.results.length > 0) {
    const landscapeImage = data.results.find(image => image.width > image.height);
    if (landscapeImage) {
      return landscapeImage.urls.regular;
    } else {
      console.warn(`Pas d'image paysage trouvée pour ${city}`);
      return null;
    }
  } else {
    console.error(`Impossible de trouver une image pour ${city}`);
    return null;
  }
};

// Icône pour un petit cercle bleu (stylisé)
const blueCircleIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#007bff; width:10px; height:10px; border-radius: 50%; border: 2px solid white;'></div>",
  iconSize: [10, 10],
  popupAnchor: [0, -15]
});

function Map({ startCity, endCity }) {
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [cityImage, setCityImage] = useState(null);
  const [showModal, setShowModal] = useState(false); // Pour afficher ou non la modal
  const markerRef = useRef(null);

  const handleModalOpen = async () => {
    setShowModal(true); // Ouvre la modal
  };

  const handleModalClose = () => {
    setShowModal(false); // Ferme la modal
  };

  useEffect(() => {
    if (startCity && endCity) {
      const fetchCoords = async () => {
        const start = await fetchCoordinates(startCity);
        const end = await fetchCoordinates(endCity);
        setStartCoords(start);
        setEndCoords(end);

        const image = await fetchCityImage(endCity);
        setCityImage(image);
      };
      fetchCoords();
    }
  }, [startCity, endCity]);

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current;

      // Ouvre la bulle au survol
      marker.on('mouseover', function () {
        marker.openPopup();
      });

      // Ferme la bulle lorsque la souris quitte
      marker.on('mouseout', function () {
        marker.closePopup();
      });
    }
  }, [endCoords]);

  return (
    <div>
      <MapContainer
        center={[48.8566, 2.3522]} 
        zoom={5}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {startCoords && endCoords && (
          <>
            {/* Ligne bleue entre les deux villes */}
            <Polyline
              positions={[startCoords, endCoords]}
              color="blue"
              weight={4}
            />

            {/* Point d'arrivée avec modal */}
            <Marker position={endCoords} icon={blueCircleIcon} ref={markerRef} eventHandlers={{ click: handleModalOpen }}>
              <Popup>
                <div>
                  <h3>{endCity}</h3>
                  {cityImage && <img src={cityImage} alt={`View of ${endCity}`} style={{ width: '200px', height: 'auto', borderRadius: '10px' }} />}
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Modal pour afficher les détails de la ville */}
      {showModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleModalClose}>X</button>
            <h2>{endCity}</h2>
            {cityImage && <img src={cityImage} alt={`Large view of ${endCity}`} style={{ width: '100%', height: 'auto', borderRadius: '10px' }} />}
            <h3>Pourquoi visiter {endCity} ?</h3>
            <p>Des informations sur pourquoi visiter {endCity}.</p>

            <h3>Que voir à {endCity} ?</h3>
            <p>Des endroits à visiter dans {endCity}.</p>

            <h3>Le saviez-vous ?</h3>
            <p>Un fun fact sur {endCity}.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;
