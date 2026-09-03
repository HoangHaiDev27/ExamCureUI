export function LandingGauge({
  value,
  color = "#e9783a",
  showLabels = false,
  min = "0",
  max = "100",
}: {
  value: number;
  color?: string;
  showLabels?: boolean;
  min?: string;
  max?: string;
}) {
  const ticks = Array.from({ length: 40 }, (_, index) => {
    const angle = Math.PI + (index / 39) * Math.PI;
    const innerRadius = 70;
    const outerRadius = 80;
    const centerX = 100;
    const centerY = 100;
    return {
      x1: centerX + Math.cos(angle) * innerRadius,
      y1: centerY + Math.sin(angle) * innerRadius,
      x2: centerX + Math.cos(angle) * outerRadius,
      y2: centerY + Math.sin(angle) * outerRadius,
      active: index < Math.round((value / 100) * 40),
    };
  });

  return (
    <div aria-hidden="true">
      <svg viewBox="0 0 200 120" className="mx-auto w-full max-w-[260px]">
        {ticks.map((tick, index) => (
          <line
            key={index}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.active ? color : "#d4d4d8"}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
        <text x="100" y="105" textAnchor="middle" fontSize="22" fontWeight="600" fill="#1a1d21">
          {value}%
        </text>
      </svg>
      {showLabels && (
        <div className="-mt-3 flex justify-between px-2 text-[11px] text-neutral-500">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}
