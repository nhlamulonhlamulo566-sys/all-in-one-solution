export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="48" className="stroke-primary" strokeWidth="4" />
        <text
          x="50"
          y="58"
          fontFamily="sans-serif"
          fontSize="40"
          textAnchor="middle"
          className="fill-primary font-bold"
        >
          AIO
        </text>
      </svg>
      <span className="text-2xl font-bold text-foreground">
        All In One Solution
      </span>
    </div>
  );
}
