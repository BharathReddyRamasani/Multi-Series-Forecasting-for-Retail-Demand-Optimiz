import { TrendingUp, Zap, PackageSearch, ShieldCheck, Cpu, BarChart3 } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { motion } from "framer-motion";

export const Features = () => {
  const featureList = [
    {
      icon: <TrendingUp className="w-6 h-6" />, 
      title: "Actionable insights",
      description: "Turn forecasts into concrete inventory actions.",
    },
    {
      icon: <PackageSearch className="w-6 h-6" />, 
      title: "Multi‑series",
      description: "Forecast thousands of store‑item pairs in one call.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />, 
      title: "Quantile confidence",
      description: "90 % confidence intervals for risk‑adjusted decisions.",
    },
    {
      icon: <Zap className="w-6 h-6" />, 
      title: "Sub‑ms inference",
      description: "Ultra‑fast predictions powered by LightGBM & XGBoost.",
    },
    {
      icon: <Cpu className="w-6 h-6" />, 
      title: "Four engines",
      description: "Choose LightGBM, XGBoost, SARIMA, or ARMA on‑the‑fly.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />, 
      title: "Real‑time analytics",
      description: "Interactive dashboards with SHAP explanations.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Features</h2>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Everything you need to predict demand, understand drivers, and act fast.
        </p>

        <motion.div
          className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.15 } },
          }}
        >
          {featureList.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
