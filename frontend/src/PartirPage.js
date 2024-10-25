import React, { useState, useEffect } from 'react';
import Map2 from './components/Map2'; // Composant Map2 pour afficher la carte
import trainIcon from './assets/train.png';
import eyeIcon from './assets/eye.png';
import brainIcon from './assets/brain.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlidersH } from '@fortawesome/free-solid-svg-icons';
import FilterPopup from './components/FilterPopup'; // Votre composant pour les filtres
import { fetchCoordinates } from './components/Map2';

const fetchDestinationsFromStation = async (stationUIC) => {
  const apiKey = '4fb96040-575e-4b5b-9c62-404107f6ca03'; // Remplacez par votre clé API SNCF
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0] + 'T000000'; // Format YYYYMMDDT000000

  const url = `https://api.sncf.com/v1/coverage/sncf/stop_areas/stop_area:SNCF:${stationUIC}/departures?count=100&from_datetime=${formattedToday}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':') // Encodage Base64 avec clé API
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.departures) {
      console.warn('Aucune donnée disponible dans la réponse API.');
      return []; // S'assurer que nous retournons un tableau vide si les données ne sont pas comme attendu
    }

    const destinationsList = {};
    const departures = data.departures;

    for (let i = 0; i < departures.length; i++) {
      const destination = departures[i].display_informations?.direction; // Vérifier si direction existe

      if (destination && !destinationsList[destination]) {
        destinationsList[destination] = true;
      }
    }

    return Object.keys(destinationsList); // Retourner la liste unique des destinations
  } catch (error) {
    console.error('Erreur lors de la récupération des destinations :', error);
    return [];
  }
};

function PartirPage() {
  const [startCity, setStartCity] = useState(''); // Ville saisie par l'utilisateur
  const [submittedStartCity, setSubmittedStartCity] = useState(''); // Ville validée après soumission
  const [selectedDate, setSelectedDate] = useState(''); // Date sélectionnée
  const [journeys, setJourneys] = useState([]); // Stockage des trajets récupérés
  const [destinations, setDestinations] = useState([]); // Stockage des destinations au départ de la gare sélectionnée
  const [gares, setGares] = useState({}); // Stockage des données JSON des gares
  const [showFilters, setShowFilters] = useState(false); // Gestion du popup de filtre
  const [topTouristCity, setTopTouristCity] = useState(null); // Stockage de la ville la plus touristique
  const [topTouristCoords, setTopTouristCoords] = useState(null);
  const [cityWeights, setCityWeights] = useState(null);
  const [selectedCityImage, setSelectedCityImage] = useState(null);
  const [cityInfo, setCityInfo] = useState(null); // Stockage des informations sur la ville

  // Charger la liste des gares à partir du fichier JSON
  useEffect(() => {
    const loadGares = async () => {
      try {
        const response = await fetch('/gares.json'); // Charger le fichier JSON depuis le dossier public
        const data = await response.json();
        setGares(data); // Stocker les gares dans l'état
      } catch (error) {
        console.error('Erreur lors du chargement des gares:', error);
      }
    };
    loadGares();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stationUIC = gares[startCity];

    if (stationUIC) {
      const fetchedDestinations = await fetchDestinationsFromStation(stationUIC);
      const journeyCities = fetchedDestinations
        .map(destination => destination.match(/\((.*?)\)/)?.[1])
        .filter(city => city);

      console.log('Villes extraites :', journeyCities);
      setDestinations(fetchedDestinations);
      findTopTouristCity(journeyCities);
    } else {
      setDestinations([]);
      alert('Veuillez entrer un nom de gare valide.');
    }

    setSubmittedStartCity(startCity);
  };

  const findTopTouristCity = async (cities) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/tourist-city');
      const touristData = await response.json();

      console.log('Données touristiques reçues :', touristData);

      setCityWeights(touristData);

      const filteredCities = cities.filter(city => touristData[city]);

      if (filteredCities.length > 0) {
        const topCity = filteredCities.reduce((prev, current) => {
          return touristData[prev] > touristData[current] ? prev : current;
        });
        setTopTouristCity(topCity);
        const coords = await fetchCoordinates(topCity);
        setTopTouristCoords(coords);
        console.log('Coordonnées de la ville touristique définie :', coords);
      } else {
        setTopTouristCity(null);
        setTopTouristCoords(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la ville touristique:', error);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
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
            />
          </div>

          <div className="icon">
            <img src={trainIcon} alt="train icon" />
          </div>

          <button className="cta-button" type="submit">C'est parti !</button>

          <button className="filter-button" type="button" onClick={toggleFilters}>
            <FontAwesomeIcon icon={faSlidersH} />
          </button>
        </form>
      </div>

      {showFilters && (
        <FilterPopup toggleFilters={toggleFilters} />
      )}

      <div className="main-section">
        <div className="left-info-section">
          {selectedCityImage && (
            <img src={selectedCityImage} alt="Image de la ville" className="city-image" />
          )}
          {cityInfo && (
            <div className="city-info">
              <h3><img src={trainIcon} alt="train icon" style={{ width: '30px', marginRight: '10px' }} /> Pourquoi visiter {cityInfo.name} ?</h3>
              <p>{cityInfo.pourquoi_visiter}</p>

              <h3><img src={eyeIcon} alt="eye icon" style={{ width: '30px', marginRight: '10px' }} /> Que voir à {cityInfo.name} ?</h3>
              <p>{cityInfo.que_voir}</p>

              <h3><img src={brainIcon} alt="brain icon" style={{ width: '30px', marginRight: '10px' }} /> Le saviez-vous ?</h3>
              <p>{cityInfo.fun_fact}</p>
            </div>
          )}
        </div>

        <div className="right-map-section">
         <Map2
            startCity={submittedStartCity}
            journeys={destinations}
            cityWeights={cityWeights}
            setCityInfo={setCityInfo}
            setSelectedCityImage={setSelectedCityImage}
          />
          <p>{JSON.stringify(cityWeights)}</p>
        </div>
      </div>

      {topTouristCity && (
        <div className="tourist-city-section">
          <h2>La ville desservie ayant le plus d'intérêt touristique est {topTouristCity}.</h2>
        </div>
      )}

      {destinations.length > 0 && (
        <div className="destinations-section">
          <h2>Gares desservies au départ de {submittedStartCity}</h2>
          <ul>
            {destinations.map((destination, index) => (
              <li key={index}>{destination}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PartirPage;
