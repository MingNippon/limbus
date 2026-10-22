import React, { useEffect } from 'react';
import { tryLockOrientation, useViewport } from '../../hooks/useViewport';

interface LandscapeStageProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-screen landscape stage used by the combat screen.
 *
 * - Landscape (desktop or phone held sideways): renders normally at full viewport size.
 * - Phone/tablet held PORTRAIT: the whole stage is rotated 90° so combat is always laid out
 *   horizontally (works even when the device has rotation-lock turned on).
 *
 * The stage is a CSS size container named `stage`, so children should use the
 * `stage-short:` / `stage-narrow:` / `stage-xs:` variants (container queries) instead of
 * viewport media queries — those stay correct even while the stage is rotated.
 */
export const LandscapeStage: React.FC<LandscapeStageProps> = ({ children, className = '' }) => {
  const vp = useViewport();
  const shouldRotate = vp.isPortrait && (vp.isTouch || vp.width < 768);

  // In fullscreen on Android, ask the browser to rotate natively for a crisper experience.
  useEffect(() => {
    tryLockOrientation('landscape');
    return () => {
      tryLockOrientation('any');
    };
  }, []);

  const style: React.CSSProperties = shouldRotate
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${vp.height}px`,
        height: `${vp.width}px`,
        transformOrigin: 'top left',
        transform: 'rotate(90deg) translateY(-100%)',
      }
    : {
        position: 'fixed',
        inset: 0,
        width: `${vp.width}px`,
        height: `${vp.height}px`,
      };

  return (
    <div
      className={`lcb-stage overflow-hidden bg-[#08070a] ${className}`}
      data-rotated={shouldRotate ? 'true' : 'false'}
      style={style}
    >
      {children}
    </div>
  );
};
