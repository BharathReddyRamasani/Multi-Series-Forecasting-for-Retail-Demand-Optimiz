import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pt-24 pb-20 bg-white">
      <div className="absolute inset-0 -z-10">
        {/* Soft gradient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1
          variants={fadeUp}
          className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900"
        >
          Predict demand <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            effortlessly
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto"
        >
          Enterprise‑grade forecasts, real‑time analytics, and AI‑driven recommendations that keep shelves stocked and waste down.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex justify-center gap-4">
          <button
            onClick={() => navigate("/register")}
            className="bg-primary text-white rounded-full px-8 py-3 font-medium hover:bg-primary/90 transition"
          >
            Get started <ArrowRight className="inline-block ml-2 -mr-1" />
          </button>
          <button
            onClick={() => navigate("/login")}
            className="border border-primary text-primary rounded-full px-8 py-3 font-medium hover:bg-primary/5 transition"
          >
            Live demo
          </button>
        </motion.div>
      </div>

      {/* Floating statistics (static for now) */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
        className="mt-16 grid grid-cols-1 sm:grid-cols-4 gap-8 max-w-4xl mx-auto px-4"
      >
        <StatItem value="99.99%" label="Uptime" />
        <StatItem value="1M+" label="Predictions" />
        <StatItem value="50K+" label="Active users" />
        <StatItem value="100+" label="Integrations" />
      </motion.div>
    </section>
  );
};

type StatProps = { value: string; label: string };
const StatItem = ({ value, label }: StatProps) => (
  <motion.div whileHover={{ scale: 1.05 }} className="text-center">
    <p className="text-3xl font-bold text-primary">{value}</p>
    <p className="mt-1 text-sm text-gray-500">{label}</p>
  </motion.div>
);
