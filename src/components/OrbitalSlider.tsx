interface OrbitalSliderProps {
  radius: number;
  angle: number;
  percentage: number;
  color: string;
  containerWidth: number;
  containerHeight: number;
}

export const OrbitalSlider = ({ 
  radius, 
  angle, 
  percentage, 
  color, 
  containerWidth, 
  containerHeight 
}: OrbitalSliderProps) => {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  
  return (
    <div 
      className="absolute pointer-events-none z-10"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="relative">
        {/* Linha do slider */}
        <div 
          className="h-1 w-16 rounded-full"
          style={{ 
            background: `${color}30`,
            boxShadow: `0 0 5px ${color}20`
          }}
        />
        
        {/* Indicador de preenchimento */}
        <div 
          className="absolute top-0 left-0 h-1 rounded-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            background: color,
            boxShadow: `0 0 10px ${color}, 0 0 20px ${color}80`
          }}
        />
        
        {/* Label de porcentagem */}
        <span 
          className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold tracking-wider whitespace-nowrap"
          style={{ 
            color,
            textShadow: `0 0 8px ${color}, 0 0 4px ${color}`
          }}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
};
