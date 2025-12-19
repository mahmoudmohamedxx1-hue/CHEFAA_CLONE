import React, { useEffect, useRef, useState } from 'react';

interface HeatmapPoint {
  x: number;
  y: number;
  intensity?: number;
}

interface HeatmapOverlayProps {
  data: HeatmapPoint[];
  width?: number;
  height?: number;
  radius?: number;
  maxIntensity?: number;
}

const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  data,
  width = 1200,
  height = 800,
  radius = 30,
  maxIntensity = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorGradient, setColorGradient] = useState<CanvasGradient | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create color gradient if not exists
    if (!colorGradient) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, 'rgba(0, 0, 255, 0)');
      gradient.addColorStop(0.2, 'rgba(0, 0, 255, 0.5)');
      gradient.addColorStop(0.4, 'rgba(0, 255, 0, 0.7)');
      gradient.addColorStop(0.6, 'rgba(255, 255, 0, 0.8)');
      gradient.addColorStop(0.8, 'rgba(255, 128, 0, 0.9)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 1)');
      setColorGradient(gradient);
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw heatmap points
    data.forEach((point) => {
      const intensity = point.intensity || 0.5;
      const adjustedRadius = radius * (0.5 + intensity * 0.5);

      // Create radial gradient for each point
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, adjustedRadius
      );

      // Color based on intensity
      const alpha = intensity * 0.6;
      gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 128, 0, ${alpha * 0.6})`);
      gradient.addColorStop(1, `rgba(255, 255, 0, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        point.x - adjustedRadius,
        point.y - adjustedRadius,
        adjustedRadius * 2,
        adjustedRadius * 2
      );
    });

    // Apply blur for smoother heatmap
    ctx.filter = 'blur(10px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';

  }, [data, width, height, radius, maxIntensity, colorGradient]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ mixBlendMode: 'multiply', opacity: 0.7 }}
      />
    </div>
  );
};

export default HeatmapOverlay;
