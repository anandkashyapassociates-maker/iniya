import { useState, useEffect } from 'react';

/**
 * Custom hook to smoothly animate numerical values from 0 (or previous value) to target value.
 * Respects 'prefers-reduced-motion' for accessibility.
 *
 * @param {number|string} endValue Target numeric value
 * @param {number} duration Duration in milliseconds (default 900ms)
 * @param {number} decimals Number of decimal places to format (default 0)
 * @returns {string|number} Animated number formatted as string or number
 */
export function useCountUp(endValue, duration = 850, decimals = 0) {
  const numericEnd = typeof endValue === 'number' ? endValue : parseFloat(endValue) || 0;
  const [displayValue, setDisplayValue] = useState(numericEnd === 0 ? 0 : 0);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(numericEnd);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const startVal = 0;
    const change = numericEnd - startVal;

    // easeOutExpo easing function for silky smooth commercial SaaS feel
    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const step = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const current = startVal + change * easedProgress;

      if (decimals > 0) {
        setDisplayValue(parseFloat(current.toFixed(decimals)));
      } else {
        setDisplayValue(Math.round(current));
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(numericEnd);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [numericEnd, duration, decimals]);

  if (isNaN(numericEnd)) {
    return endValue;
  }

  return decimals > 0 ? displayValue.toFixed(decimals) : displayValue;
}

export default useCountUp;

