// Mon-Projet/frontend/src/Intro.js

import React from 'react';
import trainIcon from './assets/train.png';
import leafIcon from './assets/leaf.png';
import world from './assets/world.png';

function Intro() {
  return (
    <div className="intro-message">
      <p className="intro-title">
        Bienvenue sur cette page qui a vocation à vous aider à trouver votre prochain voyage 
        <img src={trainIcon} alt="train emoji" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginLeft: '5px' }} />.
      </p>
      <p className="intro-text">
        Que vous comptiez partir un week-end, une semaine ou plus d’un mois sans exploser votre empreinte carbone, 
        cette page est faite pour vous !
        <img src={leafIcon} alt="leaf emoji" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginLeft: '5px' }} />.
      </p>
      <p className="intro-highlight">
        Sur un Paris - Barcelone, vous émettez 81x moins de CO2 en préférant le train à l’avion,
        et 43x moins qu’en choisissant la voiture thermique (si vous êtes 2).
      </p>
      <p className="intro-text">
        <span className="highlight">Face à ça, la solution n°1</span> est de rester chez soi à manger des Curly et à regarder Netflix.
        <span className="highlight"> La solution n°2</span> c’est de <strong>choisir ta ville de départ et de cliquer sur “C’est parti!”</strong>
        <img src={world} alt="world emoji" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginLeft: '5px' }} />
      </p>
      <p className="intro-text">
        La map vous indique alors toutes les villes accessibles en direct 
        <span className="icon-circle" style={{ backgroundColor: '#007bff', width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', border: '2px solid white', marginLeft: '5px', verticalAlign: 'middle' }}></span>
        et toutes les villes accessibles avec une escale 
        <span className="icon-circle" style={{ backgroundColor: '#28a745', width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', border: '2px solid white', marginLeft: '5px', verticalAlign: 'middle' }}></span>
      </p>
      <p className="intro-text">
       Cliquez sur un point bleu ou vert pour avoir plus d’infos sur la ville.
      </p>
    </div>
  );
}

export default Intro;



