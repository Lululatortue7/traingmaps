// components/CityModal2.js
import React from 'react';
import '../styles/Modal2.css'; // Importer le fichier CSS pour le modal
import trainIcon from '../assets/train.png'; // Importer les icônes
import eyeIcon from '../assets/eye.png';
import brainIcon from '../assets/brain.png';

function CityModal2({ city, cityInfo, cityImage, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>{city}</h2>

                {/* Afficher l'image de la ville si disponible */}
                {cityImage && <img src={cityImage} alt={`View of ${city}`} style={{ width: '100%', height: 'auto', borderRadius: '10px', marginBottom: '20px' }} />}

                {/* Afficher les informations si elles sont disponibles */}
                {cityInfo ? (
                    <>
                        <h3><img src={trainIcon} alt="train icon" style={{ width: '30px', marginRight: '10px' }} /> Pourquoi visiter {city} ?</h3>
                        <p>{cityInfo.pourquoi_visiter}</p>

                        <h3><img src={eyeIcon} alt="eye icon" style={{ width: '30px', marginRight: '10px' }} /> Que voir à {city} ?</h3>
                        <p>{cityInfo.que_voir}</p>

                        <h3><img src={brainIcon} alt="brain icon" style={{ width: '30px', marginRight: '10px' }} /> Le saviez-vous ?</h3>
                        <p>{cityInfo.fun_fact}</p>
                    </>
                ) : (
                    <p>Aucune information disponible pour {city}.</p>
                )}
            </div>
        </div>
    );
}

export default CityModal2;


