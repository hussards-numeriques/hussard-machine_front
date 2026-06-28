import React from 'react';
import { POSE_CONTENT, SHINY_POSE_CONTENT, type MascotPose } from './poses';

interface MascotProps {
  pose?: MascotPose;
  size?: number;
  className?: string;
  title?: string;
  shiny?: boolean;
}

export const Mascot: React.FC<MascotProps> = ({
  pose = 'joyeux',
  size = 256,
  className,
  title,
  shiny = false,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    width={size}
    height={size}
    className={className}
    data-pose={pose}
    role="img"
    aria-label={title ?? 'Rushy'}
  >
    {title ? <title>{title}</title> : null}
    {shiny ? SHINY_POSE_CONTENT[pose] : POSE_CONTENT[pose]}
  </svg>
);
