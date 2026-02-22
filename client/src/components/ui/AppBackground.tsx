import React, { useEffect, useState } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';

export const AppBackground = ({
    colors = ["#72b9bb", "#b5d9d9", "#ffd1bd", "#ffebe0", "#8cc5b8", "#dbf4a4"],
    distortion = 1.2,
    swirl = 0.6,
    speed = 0.8,
    offsetX = 0.08,
    veilOpacity = "bg-white/20 dark:bg-black/25"
}) => {
    const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const update = () =>
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    return (
        <div className="fixed inset-0 w-screen h-screen -z-50 pointer-events-none">
            {mounted && (
                <>
                    <MeshGradient
                        width={dimensions.width}
                        height={dimensions.height}
                        colors={colors}
                        distortion={distortion}
                        swirl={swirl}
                        grainMixer={0}
                        grainOverlay={0}
                        speed={speed}
                        offsetX={offsetX}
                    />
                    <div className={`absolute inset-0 pointer-events-none ${veilOpacity}`} />
                </>
            )}
        </div>
    );
};
