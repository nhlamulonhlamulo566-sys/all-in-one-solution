import Image from 'next/image';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <Image
        src="/icon.svg"
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        priority
      />
      <span className="text-2xl font-bold text-foreground">
        All In One Solution
      </span>
    </div>
  );
}
