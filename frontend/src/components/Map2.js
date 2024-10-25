import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { citiesData } from '../citiesData';
import cityImages from '../data/cityImages.json';
import '../styles/Modal2.css';
import DestinationMarker from './marker';

const UNSPLASH_API_KEY = 'BQ7R5EW5Azm3jvfZOdvZo8xuFskHYB-FpGTgT9mJKu4';

// Icône pour le marqueur gris (ville de départ)
const grayCircleIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#808080; width:10px; height:10px; border-radius: 50%; border: 2px solid white;'></div>",
  iconSize: [10, 10],
  popupAnchor: [0, -15]
});

// Icône pour les marqueurs bleus
const blueCircleIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#007bff; width:10px; height:10px; border-radius: 50%; border: 2px solid white;'></div>",
  iconSize: [10, 10],
  popupAnchor: [0, -15]
});

// Icône pour les marqueurs verts (ville la plus touristique)
const greenCircleIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#28a745; width:10px; height:10px; border-radius: 50%; border: 2px solid white;'></div>",
  iconSize: [10, 10],
  popupAnchor: [0, -15]
});

// Fonction pour récupérer l'image de la ville
const fetchCityImage = async (city) => {
  if (cityImages && cityImages[city]) {
    return cityImages[city];  // Si l'image est trouvée dans le fichier JSON
  }

  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${city}&client_id=${UNSPLASH_API_KEY}`);
    const data = await response.json();

    if (data && data.results && data.results.length > 0) {
      const landscapeImage = data.results.find(image => image.width > image.height);
      return landscapeImage ? landscapeImage.urls.regular : null;
    } else {
      console.error(`Impossible de trouver une image pour ${city}`);
      return null;
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'image pour ${city}:`, error);
    return null;
  }
};

function Map2({ startCity, journeys, setCityInfo, setSelectedCityImage, cityWeights }) {
  const [startCoords, setStartCoords] = useState(null); // Coordonnées de la ville de départ
  const [destinationMarkers, setDestinationMarkers] = useState([]); // Coordonnées des villes d'arrivée
  const [coordinatesCache, setCoordinatesCache] = useState({}); // Cache des coordonnées
  const [cityImage, setCityImage] = useState(null); // Ajouté cityImage pour gérer l'état de l'image sélectionnée

  // Charger le cache des coordonnées dynamiquement depuis le dossier public une seule fois
  useEffect(() => {
    const loadCoordinatesCache = async () => {
      try {
        const response = await fetch('/coordinatesCache.json');
        if (!response.ok) {
          throw new Error(`Erreur lors du chargement de coordinatesCache.json: ${response.statusText}`);
        }
        const data = await response.json();
        setCoordinatesCache(data); // Stocker le cache des coordonnées
      } catch (error) {
        console.error('Erreur lors du chargement du fichier JSON:', error);
        setCoordinatesCache({}); // Défaut à un objet vide
      }
    };
    loadCoordinatesCache();
  }, []);

  // Fonction pour obtenir les coordonnées d'une ville, d'abord via le cache, puis via Nominatim si nécessaire
  const fetchCoordinates = async (city) => {
    if (coordinatesCache[city]) {
      return coordinatesCache[city];
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`);
      if (!response.ok) {
        throw new Error(`Erreur de récupération des coordonnées pour ${city}`);
      }
      const data = await response.json();
      if (data && data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setCoordinatesCache(prevCache => ({
          ...prevCache,
          [city]: coords
        }));
        return coords;
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch coordinates for ${city}:`, error);
      return null;
    }
  };

  // Récupérer les coordonnées de la ville de départ
  useEffect(() => {
    if (startCity) {
      const fetchStartCoords = async () => {
        const coords = await fetchCoordinates(startCity);
        setStartCoords(coords); // Définit la ville de départ avec ses coordonnées
      };
      fetchStartCoords();
    }
  }, [startCity]);

  // Récupérer les coordonnées des villes de destination
  useEffect(() => {
    console.log("weights: ", cityWeights);
    const fetchDestinations = async () => {
      if (journeys && journeys.length > 0) {
        const markerPromises = journeys.map(async (journey) => {
          const destinationCity = journey.match(/\((.*?)\)/)?.[1]; // Extraire le nom de la ville entre parenthèses

          if (destinationCity) {
            const coords = await fetchCoordinates(destinationCity); // Obtenir les coordonnées de la ville
            const markerImage = await fetchCityImage(destinationCity);
            
            if (coords) {
              return {
                city: destinationCity,
                image: markerImage,
                permanent: shouldDisplayTooltipPermanent(destinationCity),
                coords,
              };
            }
          }
          return null;
        });

        const markers = await Promise.all(markerPromises);
        const validMarkers = markers.filter(marker => marker !== null);
        setDestinationMarkers(validMarkers);
        console.log('markers', validMarkers);
      }
    };
    fetchDestinations();
  }, [journeys, cityWeights]);

  // Fonction pour ouvrir le modal avec les infos de la ville sélectionnée
  const handleMarkerClick = async (city) => {
    console.log("test")
    setSelectedCityImage(null); // Réinitialiser l'image de la ville

    // Récupérer les informations de la ville dans citiesData.js
    const foundCity = citiesData.find(c => c.name.toLowerCase() === city.toLowerCase());
    setCityInfo(foundCity ? foundCity : {
      name: city,
      pourquoi_visiter: 'Aucune information disponible pour cette ville.',
      que_voir: 'Aucune information disponible pour cette ville.',
      fun_fact: 'Aucune information disponible pour cette ville.'
    });

    // Récupérer l'image de la ville
    const image = await fetchCityImage(city);
    setCityImage(image); // Met à jour cityImage
    setSelectedCityImage(image); // Met à jour l'image sélectionnée si nécessaire
  };

  const shouldDisplayTooltipPermanent = (city) => {
    if (!cityWeights) {
      return false;
    }

    console.log("test")

    return true;
  }

  return (
    <>
      <MapContainer
        center={startCoords || [48.8566, 2.3522]} // Coordonnées centrées sur la ville de départ, sinon Paris
        zoom={6}
        style={{ height: "calc(100vh - 200px)", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marqueur gris pour la ville de départ */}
        {startCoords && (
          <Marker position={startCoords} icon={grayCircleIcon}>
            <Popup>{startCity}</Popup>
          </Marker>
        )}

        {/* Marqueurs bleus pour les villes de destination */}
        {cityWeights && destinationMarkers.map((marker, index) => (
          <DestinationMarker 
            key={index}
            coords={marker.coords}
            image={marker.image}
            city={marker.city}
            permanent={marker.permanent}
            onClick={() => handleMarkerClick(marker.city)}
            icon={blueCircleIcon}
          />
        ))}
      </MapContainer>
    </>
  );
}

export const fetchCoordinates = async (city) => {
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/nominatim?city=${city}`);
    if (!response.ok) {
      throw new Error(`Erreur de récupération des coordonnées pour ${city}`);
    }
    const data = await response.json();
    return data.length > 0 ? [data[0].lat, data[0].lon] : null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des coordonnées pour ${city}:`, error);
    return null;
  }
};

export default Map2; // Ensure Map2 is the default export
