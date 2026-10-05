import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface StatCounterProps {
  end: number;
  label: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export default function StatCounter({ end, label, prefix = '', suffix = '', duration = 2000 }: StatCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-bold text-[#2d6a4f]">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-[#6b7280] mt-1">{label}</div>
    </div>
  );
}
