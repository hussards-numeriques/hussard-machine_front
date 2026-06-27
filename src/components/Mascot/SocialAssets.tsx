import React from 'react';
import { SpeedLines, JoyeuxRunner } from './poses';

export const MaskableIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="rushyGradMask" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4f46e5" />
        <stop offset="1" stopColor="#312e81" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#rushyGradMask)" />
    <g transform="translate(51.2 51.2) scale(1.6)">
      <SpeedLines />
      <JoyeuxRunner />
    </g>
  </svg>
);

export const OgBanner: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="rushyGradOg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4f46e5" />
        <stop offset="1" stopColor="#312e81" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#rushyGradOg)" />
    <g stroke="#fbbf24" strokeWidth="10" strokeLinecap="round" opacity="0.7">
      <line x1="60" y1="120" x2="160" y2="120" />
      <line x1="40" y1="170" x2="190" y2="170" />
    </g>
    <g transform="translate(150 120) scale(1.45)">
      <SpeedLines />
      <JoyeuxRunner />
    </g>
    <text x="560" y="300" fontFamily="Nunito" fontWeight="800" fontSize="120" fill="#ffffff">
      Calc Rush
    </text>
    <text x="562" y="370" fontFamily="Nunito" fontWeight="700" fontSize="44" fill="#fbbf24">
      Le calcul mental qui rush
    </text>
    <text x="562" y="430" fontFamily="Nunito" fontWeight="600" fontSize="34" fill="#c7d2fe">
      Défie tes amis · gagne des niveaux
    </text>
  </svg>
);
