import React from 'react';

export type MascotPose = 'joyeux' | 'determine' | 'clindoeil' | 'champion' | 'tete';

export const SpeedLines: React.FC = () => (
  <g stroke="#fbbf24" strokeWidth="7" strokeLinecap="round" opacity="0.9">
    <line x1="18" y1="96" x2="60" y2="96" />
    <line x1="12" y1="128" x2="66" y2="128" />
    <line x1="20" y1="160" x2="56" y2="160" />
  </g>
);

const IconBackground: React.FC = () => (
  <>
    <defs>
      <linearGradient id="rushyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4f46e5" />
        <stop offset="1" stopColor="#312e81" />
      </linearGradient>
    </defs>
    <rect width="256" height="256" rx="60" fill="url(#rushyGrad)" />
  </>
);

const RunnerLimbs: React.FC = () => (
  <>
    <g stroke="#312e81" strokeWidth="14" strokeLinecap="round">
      <path d="M116 158 L104 190" />
      <path d="M150 158 L170 184" />
    </g>
    <ellipse cx="100" cy="194" rx="17" ry="10" fill="#fbbf24" />
    <ellipse cx="176" cy="188" rx="17" ry="10" fill="#fbbf24" />
    <path d="M96 118 L72 132" stroke="#312e81" strokeWidth="12" strokeLinecap="round" />
    <circle cx="68" cy="134" r="9" fill="#fff" />
    <rect x="86" y="54" width="92" height="112" rx="24" fill="#fff" />
  </>
);

const RunnerButtons: React.FC = () => (
  <>
    <g fill="#c7d2fe">
      <rect x="98" y="124" width="20" height="16" rx="5" />
      <rect x="122" y="124" width="20" height="16" rx="5" />
      <rect x="98" y="146" width="20" height="12" rx="5" />
      <rect x="122" y="146" width="20" height="12" rx="5" />
    </g>
    <rect x="146" y="124" width="20" height="34" rx="6" fill="#fbbf24" />
  </>
);

const RunnerScreen: React.FC = () => (
  <rect x="98" y="68" width="68" height="42" rx="11" fill="#1e293b" />
);

const FrontArmHigh: React.FC = () => (
  <>
    <path d="M172 116 L196 96" stroke="#312e81" strokeWidth="12" strokeLinecap="round" />
    <circle cx="199" cy="93" r="9" fill="#fff" />
  </>
);

const FrontArmMid: React.FC = () => (
  <>
    <path d="M172 116 L198 100" stroke="#312e81" strokeWidth="12" strokeLinecap="round" />
    <circle cx="201" cy="98" r="9" fill="#fff" />
  </>
);

const FaceJoyeux: React.FC = () => (
  <>
    <circle cx="117" cy="86" r="8.5" fill="#fff" />
    <circle cx="149" cy="86" r="8.5" fill="#fff" />
    <circle cx="119" cy="87" r="4.4" fill="#1e293b" />
    <circle cx="151" cy="87" r="4.4" fill="#1e293b" />
    <path d="M118 99 Q133 110 148 99 Z" fill="#fbbf24" />
  </>
);

const FaceDetermine: React.FC = () => (
  <>
    <path d="M110 76 L126 80" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M154 76 L138 80" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="118" cy="89" r="7" fill="#fff" />
    <circle cx="148" cy="89" r="7" fill="#fff" />
    <circle cx="120" cy="90" r="3.5" fill="#1e293b" />
    <circle cx="150" cy="90" r="3.5" fill="#1e293b" />
    <path
      d="M120 101 Q134 106 148 101"
      stroke="#fbbf24"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
  </>
);

const FaceClindoeil: React.FC = () => (
  <>
    <circle cx="118" cy="88" r="7.5" fill="#fff" />
    <circle cx="120" cy="89" r="3.8" fill="#1e293b" />
    <path
      d="M140 90 Q149 83 158 90"
      stroke="#fff"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M118 100 Q132 108 150 99"
      stroke="#fbbf24"
      strokeWidth="3.8"
      fill="none"
      strokeLinecap="round"
    />
  </>
);

export const JoyeuxRunner: React.FC = () => (
  <g transform="rotate(-8 128 132)">
    <RunnerLimbs />
    <FrontArmHigh />
    <RunnerScreen />
    <FaceJoyeux />
    <RunnerButtons />
  </g>
);

const DetermineRunner: React.FC = () => (
  <g transform="rotate(-8 128 132)">
    <RunnerLimbs />
    <FrontArmMid />
    <RunnerScreen />
    <FaceDetermine />
    <RunnerButtons />
  </g>
);

const ClindoeilRunner: React.FC = () => (
  <g transform="rotate(-8 128 132)">
    <RunnerLimbs />
    <FrontArmMid />
    <RunnerScreen />
    <FaceClindoeil />
    <RunnerButtons />
  </g>
);

const Champion: React.FC = () => (
  <>
    <defs>
      <radialGradient id="rushyGradB" cx="50%" cy="38%" r="75%">
        <stop offset="0" stopColor="#6366f1" />
        <stop offset="1" stopColor="#312e81" />
      </radialGradient>
    </defs>
    <rect width="256" height="256" rx="60" fill="url(#rushyGradB)" />
    <path
      d="M188 36 L150 120 L180 120 L150 196 L210 100 L182 100 Z"
      fill="#fbbf24"
      opacity="0.28"
    />
    <ellipse cx="108" cy="206" rx="15" ry="9" fill="#fbbf24" />
    <ellipse cx="150" cy="206" rx="15" ry="9" fill="#fbbf24" />
    <g stroke="#1e293b" strokeWidth="12" strokeLinecap="round">
      <line x1="110" y1="178" x2="108" y2="198" />
      <line x1="148" y1="178" x2="150" y2="198" />
    </g>
    <g stroke="#312e81" strokeWidth="11" strokeLinecap="round">
      <line x1="170" y1="120" x2="190" y2="92" />
    </g>
    <circle cx="194" cy="86" r="11" fill="#fbbf24" />
    <rect x="84" y="64" width="92" height="116" rx="24" fill="#fff" />
    <rect x="96" y="80" width="68" height="40" rx="11" fill="#1e293b" />
    <circle cx="116" cy="100" r="7.5" fill="#fff" />
    <circle cx="118" cy="101" r="3.6" fill="#1e293b" />
    <path
      d="M138 100 Q146 94 154 100"
      stroke="#fff"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M114 112 Q130 122 146 112"
      stroke="#fbbf24"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <g fill="#c7d2fe">
      <rect x="96" y="132" width="20" height="17" rx="5" />
      <rect x="120" y="132" width="20" height="17" rx="5" />
      <rect x="96" y="156" width="20" height="17" rx="5" />
      <rect x="120" y="156" width="20" height="17" rx="5" />
    </g>
    <rect x="144" y="132" width="20" height="41" rx="6" fill="#fbbf24" />
  </>
);

const Tete: React.FC = () => (
  <>
    <rect width="256" height="256" rx="60" fill="#4f46e5" />
    <rect x="44" y="46" width="168" height="164" rx="36" fill="#fff" />
    <rect x="64" y="64" width="128" height="74" rx="16" fill="#1e293b" />
    <circle cx="104" cy="98" r="11" fill="#fff" />
    <circle cx="152" cy="98" r="11" fill="#fff" />
    <circle cx="107" cy="100" r="5.2" fill="#1e293b" />
    <circle cx="155" cy="100" r="5.2" fill="#1e293b" />
    <path
      d="M100 118 Q128 134 156 118"
      stroke="#fbbf24"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M176 70 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5 z" fill="#fbbf24" />
    <g fill="#c7d2fe">
      <rect x="64" y="156" width="26" height="20" rx="6" />
      <rect x="98" y="156" width="26" height="20" rx="6" />
      <rect x="132" y="156" width="26" height="20" rx="6" />
      <rect x="64" y="184" width="26" height="18" rx="6" />
      <rect x="98" y="184" width="26" height="18" rx="6" />
    </g>
    <rect x="166" y="156" width="26" height="46" rx="7" fill="#fbbf24" />
  </>
);

const Sparkle: React.FC = () => (
  <path d="M196 56 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#fbbf24" />
);

// eslint-disable-next-line react-refresh/only-export-components
export const POSE_CONTENT: Record<MascotPose, React.ReactNode> = {
  joyeux: (
    <>
      <IconBackground />
      <SpeedLines />
      <JoyeuxRunner />
      <Sparkle />
    </>
  ),
  determine: (
    <>
      <IconBackground />
      <SpeedLines />
      <DetermineRunner />
    </>
  ),
  clindoeil: (
    <>
      <IconBackground />
      <SpeedLines />
      <ClindoeilRunner />
    </>
  ),
  champion: <Champion />,
  tete: <Tete />,
};
