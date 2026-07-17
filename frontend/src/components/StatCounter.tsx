import { useEffect, useState } from "react";

type StatCounterProps = {
  end: number;
  suffix?: string;
  label: string;
};

export const StatCounter = ({ end, suffix = "", label }: StatCounterProps) => {
  const [value, setValue] = useState(0);
  const duration = 1500; // ms

  useEffect(() => {
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setValue(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end]);

  return (
    <div className="text-center">
      <p className="text-4xl font-bold text-primary">{value}{suffix}</p>
      <p className="mt-1 text-sm text-gray-600">{label}</p>
    </div>
  );
};
