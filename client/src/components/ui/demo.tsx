import React from 'react';
import { HeroSection } from "./hero-section-with-smooth-bg-shader";

const DemoOne: React.FC = () => {
  return (
    <HeroSection
      distortion={1.2}
      speed={0.8}
    />
  );
};

export default DemoOne;
