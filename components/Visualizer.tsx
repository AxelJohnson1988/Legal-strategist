import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  volume: number;
  isActive: boolean;
  status: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ volume, isActive, status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    const render = () => {
      // Resize
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      if (!isActive) {
         // Resting State
         ctx.beginPath();
         ctx.arc(cx, cy, 40, 0, Math.PI * 2);
         ctx.strokeStyle = '#333';
         ctx.lineWidth = 2;
         ctx.stroke();
         return;
      }

      // Active Animation
      rotation += 0.01;
      
      // Base radius plus volume reactivity
      // Volume is 0-1 approx.
      const baseRadius = 80;
      const dynamicRadius = baseRadius + (volume * 200);

      // Draw "Grok" style concentric circles / Orb
      const gradient = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, dynamicRadius);
      
      if (status === 'connecting') {
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.5, '#6366f1'); // Indigo
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
      } else if (status === 'error') {
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.5, '#ef4444'); // Red
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else {
          // Connected / Live
          // The Phoenix/Grok aesthetic (Neon Blue/Purple)
          gradient.addColorStop(0, '#e0e7ff');
          gradient.addColorStop(0.4, '#818cf8');
          gradient.addColorStop(0.8, '#4338ca');
          gradient.addColorStop(1, 'rgba(67, 56, 202, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, dynamicRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner details - "The Eye" or thinking dots
      const numDots = 8;
      const dotRadius = 4;
      const ringRadius = baseRadius * 0.6;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      
      for(let i = 0; i < numDots; i++) {
          const angle = (i / numDots) * Math.PI * 2;
          const x = Math.cos(angle) * ringRadius;
          const y = Math.sin(angle) * ringRadius;
          
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fill();
      }
      ctx.restore();

      // Outer rings
      ctx.beginPath();
      ctx.arc(cx, cy, dynamicRadius * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [volume, isActive, status]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
    />
  );
};