import { StatCounter } from "./StatCounter";

export const Statistics = () => (
  <section className="py-20 bg-gray-50">
    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
      <StatCounter end={99} suffix="%" label="Uptime" />
      <StatCounter end={1000000} suffix="+" label="Predictions/month" />
      <StatCounter end={50000} suffix="+" label="Active users" />
      <StatCounter end={120} suffix="+" label="Integrations" />
    </div>
  </section>
);
