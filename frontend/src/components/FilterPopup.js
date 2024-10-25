import React, { useState } from 'react';

function FilterPopup({ toggleFilters, isBeach, setIsBeach, isMountain, setIsMountain, isCapital, setIsCapital }) {
  // État pour gérer la sélection du nombre de correspondances
  const [maxCorrespondances, setMaxCorrespondances] = useState('>3');

  return (
    <div className="filter-popup-overlay">
      <div className="filter-popup">
        <h2>Filtres</h2>

        {/* Case à cocher "Voir seulement les trains de nuit" */}
        <div className="filter-item">
          <input type="checkbox" className="filter-checkbox" style={{ marginRight: '5px' }} />
          <label>Voir seulement les trains de nuit</label>
        </div>

        {/* Curseur pour le nombre de correspondances */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="correspondances">Nombre maximum de correspondances souhaitées :</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              id="correspondances"
              type="range"
              min="0"
              max="4"
              step="1"
              value={maxCorrespondances === '>3' ? 4 : maxCorrespondances}
              onChange={(e) => setMaxCorrespondances(e.target.value === '4' ? '>3' : e.target.value)}
              style={{ flex: 1 }}  // Faire en sorte que le curseur prenne de la place
            />
            <span>{maxCorrespondances}</span>
          </div>
        </div>

        {/* Filtres supplémentaires */}
        <div className="filter-item">
          <input
            type="checkbox"
            className="filter-checkbox"
            checked={isBeach}
            onChange={(e) => setIsBeach(e.target.checked)}
          />
          <label>Plage / Soleil</label>
        </div>

        <div className="filter-item">
          <input
            type="checkbox"
            className="filter-checkbox"
            checked={isMountain}
            onChange={(e) => setIsMountain(e.target.checked)}
          />
          <label>Montagne</label>
        </div>

        <div className="filter-item">
          <input
            type="checkbox"
            className="filter-checkbox"
            checked={isCapital}
            onChange={(e) => setIsCapital(e.target.checked)}
          />
          <label>Capitale</label>
        </div>

        <button onClick={toggleFilters}>Fermer</button>
      </div>
    </div>
  );
}

export default FilterPopup;
