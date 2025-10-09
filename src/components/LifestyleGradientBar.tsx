import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const LifestyleGradientBar = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server or if not lifestyle theme
  if (!mounted || theme !== 'lifestyle') {
    return null;
  }

  return (
    <div className="gradient-header w-full" aria-hidden="true" />
  );
};
