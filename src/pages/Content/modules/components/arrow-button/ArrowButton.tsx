import React, { useState } from 'react';
import { Direction } from '../../types';

type Props = {
  dark?: boolean;
  direction?: Direction;
  disabled?: boolean;
  onClick?: () => void;
  hovering?: boolean;
  hoverIndependent?: boolean;
  size?: number;
};

export default function ArrowButton({
  dark,
  direction = Direction.UP,
  disabled = false,
  onClick,
  hovering = false,
  hoverIndependent = true,
  size = 24,
}: Props): JSX.Element {
  const [isHovering, setHovering] = useState(hovering);
  function handleClick() {
    if (!disabled && onClick) onClick();
  }
  function onHover() {
    if (hoverIndependent) setHovering(true);
  }
  function onLeave() {
    if (hoverIndependent) setHovering(false);
  }

  const rotation = {
    [Direction.LEFT]: -90,
    [Direction.RIGHT]: 90,
    [Direction.UP]: 0,
    [Direction.DOWN]: 180,
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        backgroundColor:
          hoverIndependent && !disabled && isHovering
            ? dark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(15, 23, 42, 0.08)'
            : hoverIndependent
            ? 'transparent'
            : dark
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(15, 23, 42, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 100,
        border: `1px solid ${
          dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)'
        }`,
        transform: `rotate(${rotation[direction]}deg)`,
        cursor: !disabled ? 'pointer' : 'default',
      }}
    >
      <svg
        height={size <= 22 ? '7' : '8'}
        viewBox="0 0 24 24"
        width={size <= 22 ? '7' : '8'}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M23.677 18.52c.914 1.523-.183 3.472-1.967 3.472h-19.414c-1.784 0-2.881-1.949-1.967-3.472l9.709-16.18c.891-1.483 3.041-1.48 3.93 0l9.709 16.18z"
          fill={
            hovering || disabled
              ? dark
                ? 'var(--tfc-dark-mode-text-primary)'
                : 'rgb(125, 134, 141)'
              : dark
              ? 'var(--tfc-dark-mode-text-secondary)'
              : 'var(--ic-brand-font-color-dark)'
          }
        />
      </svg>
    </div>
  );
}
