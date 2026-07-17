import { Check } from "lucide-react";

type PricingCardProps = {
  title: string;
  price: string;
  features: string[];
  recommended?: boolean;
};

export const PricingCard = ({ title, price, features, recommended = false }: PricingCardProps) => (
  <div
    className={`flex flex-col p-8 rounded-xl border ${
      recommended ? "border-primary bg-primary/5" : "border-gray-200"
    } transition-shadow hover:shadow-lg`}
  >
    {recommended && (
      <span className="self-start bg-primary text-white text-xs py-1 px-3 rounded-full mb-4">
        Recommended
      </span>
    )}
    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
    <p className="mt-4 text-4xl font-bold text-primary">{price}</p>
    <ul className="mt-6 space-y-3 flex-1">
      {features.map((feat, i) => (
        <li key={i} className="flex items-center gap-2 text-gray-600">
          <Check className="w-4 h-4 text-primary" /> {feat}
        </li>
      ))}
    </ul>
    <button className="mt-6 w-full bg-primary text-white rounded-full py-2 font-medium hover:bg-primary/90 transition">
      Choose {title}
    </button>
  </div>
);
