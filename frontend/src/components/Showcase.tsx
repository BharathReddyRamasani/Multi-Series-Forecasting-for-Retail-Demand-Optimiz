import { motion } from "framer-motion";
import { Link } from "react-router-dom";

type ShowcaseItem = {
  title: string;
  text: string;
  image: string; // path in public/
  reverse?: boolean;
};

const items: ShowcaseItem[] = [
  {
    title: "Forecast dashboard",
    text: "See 30‑day horizons, confidence bands, and custom alerts all in one view.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    reverse: false,
  },
  {
    title: "Explainability panel",
    text: "SHAP breakdown per forecast lets your merchandisers trust the model.",
    image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=800&q=80",
    reverse: true,
  },
  {
    title: "Realtime alerts",
    text: "Trigger Slack/Webhook on stock‑out risk – no manual monitoring required.",
    image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=800&q=80",
    reverse: false,
  },
];

export const Showcase = () => (
  <section id="solutions" className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 space-y-24">
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          className={`flex flex-col ${item.reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12`}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Image */}
          <div className="flex-1">
            <img
              src={item.image}
              alt={item.title}
              className="rounded-xl shadow-lg w-4/5 max-h-72 object-cover mx-auto"
            />
          </div>

          {/* Text */}
          <div className="flex-1 text-center lg:text-left max-w-lg mx-auto">
            <h3 className="text-2xl font-bold text-gray-900">{item.title}</h3>
            <p className="mt-4 text-gray-600">{item.text}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);
