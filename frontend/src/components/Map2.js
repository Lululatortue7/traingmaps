import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { citiesData } from '../citiesData';
import cityImages from '../data/cityImages.json';
import DestinationMarker from './marker';
import '../styles/Modal2.css';

const UNSPLASH_API_KEY = 'BQ7R5EW5Azm3jvfZOdvZo8xuFskHYB-FpGTgT9mJKu4';

// Icons for markers
const grayCircleIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#808080; width:10px; height:10px; border-radius: 50%; border: 2px solid white;'></div>",
  iconSize: [10, 10],
  popupAnchor: [0, -15],
});

const blueCircleIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#007bff; width:10px; height:10px; border-radius: 50%; border: 2px solid white;'></div>",
  iconSize: [10, 10],
  popupAnchor: [0, -15],
});

const greenCircleIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#28a745; width:10px; height:10px; border-radius: 50%; border: 2px solid white;'></div>",
  iconSize: [10, 10],
  popupAnchor: [0, -15],
});

// Function to fetch city image
const fetchCityImage = async (city) => {
  if (cityImages && cityImages[city]) {
    return cityImages[city];
  }
  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${city}&client_id=${UNSPLASH_API_KEY}`);
    const data = await response.json();
    if (data && data.results && data.results.length > 0) {
      const landscapeImage = data.results.find(image => image.width > image.height);
      return landscapeImage ? landscapeImage.urls.regular : null;
    } else {
      console.error(`Unable to find an image for ${city}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching image for ${city}:`, error);
    return null;
  }
};

function Map2({ startCity, setCityInfo, setSelectedCityImage, setSelectedDestinationInfo, cityWeights }) {
  const [startCoords, setStartCoords] = useState(null);
  const [destinationMarkers, setDestinationMarkers] = useState([]);
  const [escaleMarkers, setEscaleMarkers] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(6);
  const [coordinatesCache, setCoordinatesCache] = useState({});

  const MapZoomHandler = () => {
    useMapEvents({
      zoomend: (event) => {
        setZoomLevel(event.target.getZoom());
      },
    });
    return null;
  };

  useEffect(() => {
    const loadCoordinatesCache = async () => {
      try {
        const response = await fetch('/coordinatesCache.json');
        if (!response.ok) throw new Error(`Error loading coordinatesCache.json: ${response.statusText}`);
        const data = await response.json();
        setCoordinatesCache(data);
      } catch (error) {
        console.error('Error loading JSON file:', error);
        setCoordinatesCache({});
      }
    };
    loadCoordinatesCache();
  }, []);

  const fetchCoordinates = async (city) => {
    if (coordinatesCache[city]) {
      return coordinatesCache[city];
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setCoordinatesCache((prevCache) => ({ ...prevCache, [city]: coords }));
        return coords;
      }
    } catch (error) {
      console.error(`Error fetching coordinates for ${city}:`, error);
    }
    return null;
  };

  useEffect(() => {
    if (startCity) {
      const fetchStartCoords = async () => {
        const coords = await fetchCoordinates(startCity);
        setStartCoords(coords || [48.8566, 2.3522]);
      };
      fetchStartCoords();
    }
  }, [startCity]);

  // Fetch direct destination markers (blue)
  useEffect(() => {
    const fetchDestinationsFromAPI = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/destinations?origin=${encodeURIComponent(startCity)}`);
        if (!response.ok) throw new Error(`Error fetching destinations: ${response.statusText}`);
        const destinations = await response.json();

        const markers = await Promise.all(
          destinations.map(async (destination) => {
            const image = await fetchCityImage(destination.destination_name);
            return {
              city: destination.destination_name,
              coords: [parseFloat(destination.destination_latitude), parseFloat(destination.destination_longitude)],
              image,
              info: {
                price: destination.train_min_price,
                duration: destination.train_min_duration,
                link: destination.link_URL,
              },
              isDirect: true // Blue markers are direct routes
            };
          })
        );
        setDestinationMarkers(markers);
      } catch (error) {
        console.error('Error fetching destinations:', error);
      }
    };
    if (startCity) fetchDestinationsFromAPI();
  }, [startCity]);

  // Fetch stopover destination markers (green) from `/api/accessible-cities`
  useEffect(() => {
    const fetchEscaleDestinationsFromAPI = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/accessible-cities?origin=${encodeURIComponent(startCity)}`);
        if (!response.ok) throw new Error(`Error fetching cities with stopover: ${response.statusText}`);
        const escaleDestinations = await response.json();

        const markers = escaleDestinations.map((destination) => ({
          city: destination.city,
          coords: [parseFloat(destination.destination_latitude), parseFloat(destination.destination_longitude)],
          escale: destination.escale,
          tourist_weight: destination.tourist_weight,
          isDirect: false // Green markers are routes with a stopover
        }));
        setEscaleMarkers(markers);
      } catch (error) {
        console.error('Error fetching cities with stopover:', error);
      }
    };
    if (startCity) fetchEscaleDestinationsFromAPI();
  }, [startCity]);

  const handleMarkerClick = async (marker) => {
    const { city, info, isDirect } = marker;
    const foundCity = citiesData.find(c => c.name.toLowerCase() === city.toLowerCase());
    const cityInfoData = foundCity || {
      name: city,
      pourquoi_visiter: 'Aucune information disponible pour cette ville.',
      que_voir: 'Aucune information disponible pour cette ville.',
      fun_fact: 'Aucune information disponible pour cette ville.',
    };
    setCityInfo(cityInfoData);

    const image = await fetchCityImage(city);
    setSelectedCityImage(image);

    if (isDirect) {
      // For blue markers (direct routes)
      setSelectedDestinationInfo({
        destination_name: city,
        train_min_price: info ? info.price : 'N/A',
        train_min_duration: info ? info.duration : 'N/A',
        link_URL: info ? info.link : '#',
        isDirect: true
      });
    } else {
      // For green markers (routes with stopover)
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/routes-with-escale?origin=${encodeURIComponent(startCity)}&destination=${encodeURIComponent(city)}`);
        const routeData = await response.json();

        const selectedEscaleCity = routeData.sort((a, b) => b.total_points - a.total_points)[0];
        setSelectedDestinationInfo({
          destination_name: city,
          escale_info: {
            price_A: selectedEscaleCity.price_min_trajet_A,
            duration_A: selectedEscaleCity.train_min_duration_trajet_A,
            link_A: selectedEscaleCity.link_URL,
            escale: selectedEscaleCity.escale,
            price_B: selectedEscaleCity.price_min_trajet_B,
            duration_B: selectedEscaleCity.train_min_duration_trajet_B,
            link_B: selectedEscaleCity.link_URL,
          },
          isDirect: false
        });
      } catch (error) {
        console.error('Error fetching stopover route information:', error);
      }
    }
  };

  return (
    <MapContainer center={startCoords || [48.8566, 2.3522]} zoom={zoomLevel} style={{ height: "calc(100vh - 200px)", width: "100%" }}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapZoomHandler />

      {startCoords && (
        <Marker position={startCoords} icon={grayCircleIcon}>
          <Popup>{startCity}</Popup>
        </Marker>
      )}

      {destinationMarkers.map((marker, index) => (
        <DestinationMarker
          key={index}
          coords={marker.coords}
          city={marker.city}
          image={marker.image}
          icon={blueCircleIcon}
          onClick={() => handleMarkerClick(marker)}
        />
      ))}

      {escaleMarkers.map((marker, index) => (
        <Marker
          key={`escale-${index}`}
          position={marker.coords}
          icon={greenCircleIcon}
          eventHandlers={{
            click: () => handleMarkerClick(marker),
          }}
        >
          <Popup>
            <strong>{marker.city}</strong><br />
            Escale à : {marker.escale}<br />
            Poids touristique : {marker.tourist_weight}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default Map2;
