import React from 'react';
import { POSE_CONTENT, type MascotPose } from './poses';

interface MascotProps {
  pose?: MascotPose;
  size?: number;
  className?: string;
  title?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  pose = 'joyeux',
  size = 256,
  className,
  title,
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
    {POSE_CONTENT[pose]}
  </svg>
);
