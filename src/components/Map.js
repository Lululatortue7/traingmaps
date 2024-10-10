import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Clé API Unsplash (remplace par la tienne)
const UNSPLASH_API_KEY = 'BQ7R5EW5Azm3jvfZOdvZo8xuFskHYB-FpGTgT9mJKu4'; // Ta clé API Unsplash

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
    return data.results[0].urls.regular; // Retourne une image plus grande (taille regular)
  } else {
    console.error(`Impossible de trouver une image pour ${city}`);
    return null;
  }
};

// Icône pour un petit cercle bleu (stylisé)
const blueCircleIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#007bff; width:10px; height:10px; border-radius: 50%; border: 2px solid white;'></div>",
  iconSize: [10, 10], // Taille plus petite du point
  popupAnchor: [0, -15] // Ajuste la position de la popup par rapport à l'icône
});

function Map({ startCity, endCity }) {
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [cityImage, setCityImage] = useState(null); // Stocke l'image de la ville
  const markerRef = useRef(null); // Référence pour le marqueur

  useEffect(() => {
    if (startCity && endCity) {
      const fetchCoords = async () => {
        const start = await fetchCoordinates(startCity);
        const end = await fetchCoordinates(endCity);
        setStartCoords(start);
        setEndCoords(end);

        // Récupérer l'image de la ville de destination
        const image = await fetchCityImage(endCity);
        setCityImage(image); // Mettre à jour l'état avec l'image
      };
      fetchCoords();
    }
  }, [startCity, endCity]);

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current;

      // Afficher la popup au survol
      marker.on('mouseover', function () {
        marker.openPopup();
      });

      // Masquer la popup lorsque la souris quitte
      marker.on('mouseout', function () {
        marker.closePopup();
      });
    }
  }, [endCoords]);

  return (
    <MapContainer
      center={[48.8566, 2.3522]} // Centre initial sur Paris
      zoom={5}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Si les deux coordonnées existent, trace la ligne */}
      {startCoords && endCoords && (
        <>
          <Polyline
            positions={[startCoords, endCoords]}
            color="blue"
            weight={4} // Épaisseur de la ligne
          />

          {/* Ajout du point bleu au niveau de la ville de destination */}
          <Marker position={endCoords} icon={blueCircleIcon} ref={markerRef}>
            <Popup
              autoPan={true} // Active le déplacement de la carte si la popup sort de l'écran
              autoPanPadding={[50, 50]} // Marge autour de la popup lors du déplacement
              keepInView={true} // Assure que la popup reste visible
            >
              <div>
                <h3>{endCity}</h3>
                {/* Afficher l'image si elle existe, taille doublée */}
                {cityImage && <img src={cityImage} alt={`Image de ${endCity}`} style={{ width: '200px', height: 'auto', borderRadius: '10px' }} />}
              </div>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}

export default Map;

