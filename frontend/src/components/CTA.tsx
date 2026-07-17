import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-r from-primary to-purple-600 text-white text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="text-4xl font-bold">
          Supercharge your inventory with AI‑driven forecasts.
        </h2>
        <p className="mt-4 text-lg">
          Join the leaders who are already reducing stockouts and excess inventory.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="mt-6 inline-flex items-center gap-2 bg-white text-primary font-medium rounded-full px-6 py-3 hover:bg-white/90 transition"
        >
          Get started <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </section>
  );
};
