import React, { useState, useEffect } from 'react';
import Map2 from './components/Map2';
import trainIcon from './assets/train.png';
import eyeIcon from './assets/eye.png';
import brainIcon from './assets/brain.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlidersH } from '@fortawesome/free-solid-svg-icons';
import FilterPopup from './components/FilterPopup';
import Intro from './Intro';

// Fetch stopover route details
const fetchRoutesWithEscale = async (startCity, destinationCity) => {
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/routes-with-escale?origin=${encodeURIComponent(startCity)}&destination=${encodeURIComponent(destinationCity)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stopover route:', error);
    return null;
  }
};

const fetchDestinationsFromStation = async (startCity) => {
  const url = `http://127.0.0.1:5000/api/destinations?origin=${encodeURIComponent(startCity)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const destinations = await response.json();
    return destinations.map(dest => ({
      destination_name: dest.destination_name,
      coords: [parseFloat(dest.destination_latitude), parseFloat(dest.destination_longitude)],
      train_min_price: dest.train_min_price,
      train_min_duration: dest.train_min_duration,
      link_URL: dest.link_URL,
      isDirect: true, // Mark as direct route
    }));
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return [];
  }
};

const fetchCitySuggestions = async (query) => {
  if (query.length < 3) return [];
  const url = `http://127.0.0.1:5000/api/city-suggestions?query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching city suggestions:', error);
    return [];
  }
};

function PartirPage() {
  const [startCity, setStartCity] = useState('');
  const [submittedStartCity, setSubmittedStartCity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [topTouristCity, setTopTouristCity] = useState(null);
  const [cityWeights, setCityWeights] = useState(null);
  const [selectedCityImage, setSelectedCityImage] = useState(null);
  const [cityInfo, setCityInfo] = useState(null);
  const [startCityCoords, setStartCityCoords] = useState(null);
  const [showPermanentTooltips, setShowPermanentTooltips] = useState(false);
  const [selectedDestinationInfo, setSelectedDestinationInfo] = useState(null);
  const [greenRouteInfo, setGreenRouteInfo] = useState(null); // state for stopover route
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fetchedDestinations = await fetchDestinationsFromStation(startCity);

    if (fetchedDestinations.length > 0) {
      setDestinations(fetchedDestinations);
      const destinationNames = fetchedDestinations.map(dest => dest.destination_name);
      findTopTouristCity(destinationNames);
      setShowPermanentTooltips(true);
    } else {
      setDestinations([]);
      alert('No destinations found for this departure city.');
    }

    setSubmittedStartCity(startCity);

    const coords = await fetchCoordinates(startCity);
    setStartCityCoords(coords || [48.8566, 2.3522]); 
    setShowSuggestions(false);
  };

  const handleCityInputChange = async (e) => {
    const query = e.target.value;
    setStartCity(query);
    if (query.length >= 3) {
      const suggestions = await fetchCitySuggestions(query);
      setCitySuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setStartCity(suggestion);
    setShowSuggestions(false);
  };

  const fetchCoordinates = async (city) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (error) {
      console.error(`Error fetching coordinates for ${city}:`, error);
    }
    return null;
  };

  const findTopTouristCity = async (cities) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/tourist-city');
      const touristData = await response.json();
      setCityWeights(touristData);

      const filteredCities = cities.filter(city => touristData[city]);
      if (filteredCities.length > 0) {
        const topCity = filteredCities.reduce((prev, current) => (
          touristData[prev] > touristData[current] ? prev : current
        ));
        setTopTouristCity(topCity);
      } else {
        setTopTouristCity(null);
      }
    } catch (error) {
      console.error('Error fetching tourist city:', error);
    }
  };

  const handleMarkerClick = async (destinationInfo) => {
    if (!destinationInfo.isDirect) {
      // Fetch stopover details only if it's a green marker (not direct)
      const escaleData = await fetchRoutesWithEscale(submittedStartCity, destinationInfo.destination_name);
      if (escaleData && escaleData.length > 0) {
        const bestEscale = escaleData.reduce((prev, current) => (current.total_points > prev.total_points ? current : prev));
        setGreenRouteInfo({
          destination_name: destinationInfo.destination_name,
          escale_city: bestEscale.escale,
          price_A: bestEscale.price_min_trajet_A,
          duration_A: bestEscale.train_min_duration_trajet_A,
          link_A: bestEscale.link_URL,
          price_B: bestEscale.price_min_trajet_B,
          duration_B: bestEscale.train_min_duration_trajet_B,
          link_B: bestEscale.link_URL,
        });
      } else {
        setGreenRouteInfo(null);
      }
    } else {
      // Reset stopover details if it's a blue marker (direct route)
      setGreenRouteInfo(null);
    }
    setSelectedDestinationInfo(destinationInfo);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const formatDuration = (minutes) => {
    if (minutes > 59) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Voyager en train à travers l'Europe et le monde n'a jamais été aussi facile</h1>
      </header>

      <div className="form-section">
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="depart">Ville de départ</label>
            <input
              type="text"
              id="depart"
              placeholder="Ville de départ"
              value={startCity}
              onChange={handleCityInputChange}
              onFocus={() => startCity.length >= 3 && setShowSuggestions(true)}
            />
            {showSuggestions && (
              <ul className="suggestions-list">
                {citySuggestions.map((suggestion, index) => (
                  <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
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

          <button className="cta-button" type="submit">C'est parti !</button>

          <button className="filter-button" type="button" onClick={toggleFilters}>
            <FontAwesomeIcon icon={faSlidersH} />
          </button>
        </form>
      </div>

      {showFilters && <FilterPopup toggleFilters={toggleFilters} />}

      <div className="main-section">
        <div className="left-info-section">
          {selectedCityImage && (
            <img src={selectedCityImage} alt="Image de la ville" className="city-image" />
          )}
          {!cityInfo ? (
            <Intro />
          ) : (
            <div className="city-info">
              {greenRouteInfo ? (
                <>
                  <div className="reservation-info-card">
                    <h2>{greenRouteInfo.destination_name}</h2>
                    <p><strong>{submittedStartCity} 🚆 {greenRouteInfo.escale_city}</strong></p>
                    <p>À partir de : {greenRouteInfo.price_A}€</p>
                    <p>Durée minimale : {formatDuration(greenRouteInfo.duration_A)}</p>
                    <a href={greenRouteInfo.link_A} target="_blank" rel="noopener noreferrer" className="reservation-button">
                      Réserver votre billet
                    </a>
                  </div>
                  <div className="reservation-info-card">
                    <p><strong>{greenRouteInfo.escale_city} 🚆 {greenRouteInfo.destination_name}</strong></p>
                    <p>À partir de : {greenRouteInfo.price_B}€</p>
                    <p>Durée minimale : {formatDuration(greenRouteInfo.duration_B)}</p>
                    <a href={greenRouteInfo.link_B} target="_blank" rel="noopener noreferrer" className="reservation-button">
                      Réserver votre billet
                    </a>
                  </div>
                </>
              ) : (
                <>
                  {selectedDestinationInfo && (
                    <div className="reservation-info-card">
                      <h2>{selectedDestinationInfo.destination_name}</h2>
                      <div className="train-route">
                        <span className="city-name">{submittedStartCity}</span>
                        <div className="train-track">
                          <img src={trainIcon} alt="Train" className="train-icon" />
                        </div>
                        <span className="city-name">{selectedDestinationInfo.destination_name}</span>
                      </div>
                      <p><strong>À partir de : </strong>{selectedDestinationInfo.train_min_price}€</p>
                      <p><strong>Durée minimale : </strong>{formatDuration(parseInt(selectedDestinationInfo.train_min_duration))}</p>
                      <a href={selectedDestinationInfo.link_URL} target="_blank" rel="noopener noreferrer" className="reservation-button">
                        Réserver votre billet
                      </a>
                    </div>
                  )}
                </>
              )}
              <h3>
                <img src={trainIcon} alt="train icon" style={{ width: '30px', marginRight: '10px' }} /> Pourquoi visiter {cityInfo.name} ?
              </h3>
              <p>{cityInfo.pourquoi_visiter}</p>
              <h3>
                <img src={eyeIcon} alt="eye icon" style={{ width: '30px', marginRight: '10px' }} /> Que voir à {cityInfo.name} ?
              </h3>
              <p>{cityInfo.que_voir}</p>
              <h3>
                <img src={brainIcon} alt="brain icon" style={{ width: '30px', marginRight: '10px' }} /> Le saviez-vous ?
              </h3>
              <p>{cityInfo.fun_fact}</p>
            </div>
          )}
        </div>

        <div className="right-map-section">
          <Map2
            startCity={submittedStartCity}
            startCoords={startCityCoords}
            destinations={destinations}
            cityWeights={cityWeights}
            showPermanentTooltips={showPermanentTooltips}
            setCityInfo={setCityInfo}
            setSelectedCityImage={setSelectedCityImage}
            setSelectedDestinationInfo={handleMarkerClick} 
          />
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
              <li key={index}>{destination.destination_name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PartirPage;
