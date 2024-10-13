import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/Modal.css';
import trainIcon from '../assets/train.png';
import eyeIcon from '../assets/eye.png';
import brainIcon from '../assets/brain.png';
import { citiesData } from '../citiesData'; // Importation des données des villes

const UNSPLASH_API_KEY = 'BQ7R5EW5Azm3jvfZOdvZo8xuFskHYB-FpGTgT9mJKu4';

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
  const [showModal, setShowModal] = useState(false); 
  const markerRef = useRef(null);
  const [cityInfo, setCityInfo] = useState(null); // Stockage des infos de la ville

  const handleModalOpen = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
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

        // Recherche des infos dans le fichier citiesData.js
        const foundCity = citiesData.find(city => city.name.toLowerCase() === endCity.toLowerCase());
        if (foundCity) {
          setCityInfo(foundCity);
        } else {
          setCityInfo(null); // Si la ville n'est pas trouvée, réinitialiser cityInfo
        }
      };
      fetchCoords();
    }
  }, [startCity, endCity]);

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current;
      marker.on('mouseover', () => marker.openPopup());
      marker.on('mouseout', () => marker.closePopup());
    }
  }, [endCoords]);

  return (
    <div>
      <MapContainer
        center={[49.1193, 6.1757]}
        zoom={5}
        style={{ height: "calc(100vh - 200px)", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {startCoords && endCoords && (
          <>
            <Polyline positions={[startCoords, endCoords]} color="blue" weight={4} />

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

            {/* Si cityInfo existe, afficher les détails, sinon, n'afficher que le nom et l'image */}
            {cityInfo ? (
              <>
                <h3><img src={trainIcon} alt="train icon" style={{ width: '30px', marginRight: '10px' }} /> Pourquoi visiter {endCity} ?</h3>
                <p>{cityInfo.pourquoi_visiter}</p>

                <h3><img src={eyeIcon} alt="eye icon" style={{ width: '30px', marginRight: '10px' }} /> Que voir à {endCity} ?</h3>
                <p>{cityInfo.que_voir}</p>

                <h3><img src={brainIcon} alt="brain icon" style={{ width: '30px', marginRight: '10px' }} /> Le saviez-vous ?</h3>
                <p>{cityInfo.fun_fact}</p>
              </>
            ) : (
              <p></p> /* Ce message est facultatif */
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;
