import { PricingCard } from "./PricingCard";

export const Pricing = () => {
  const plans = [
    {
      title: "Starter",
      price: "$0",
      features: ["Up to 5,000 forecasts", "Email support", "Community access"],
    },
    {
      title: "Growth",
      price: "$49/mo",
      features: [
        "Unlimited forecasts",
        "Priority email support",
        "Advanced analytics",
        "Custom integrations",
      ],
      recommended: true,
    },
    {
      title: "Enterprise",
      price: "Contact us",
      features: [
        "All Growth features",
        "Dedicated success manager",
        "SLA‑backed uptime",
        "On‑prem deployment",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Pricing that scales</h2>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Simple, transparent pricing. No hidden fees.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p, i) => (
            <PricingCard key={i} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
};
