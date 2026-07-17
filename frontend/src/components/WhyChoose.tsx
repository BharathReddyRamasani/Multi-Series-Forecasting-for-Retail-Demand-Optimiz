import { motion } from "framer-motion";
import { CheckCircle, Clock, Zap } from "lucide-react";

type CardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

export const WhyChoose = () => (
  <section id="why" className="py-20 bg-white">
    <div className="max-w-6xl mx-auto px-4 text-center">
      <h2 className="text-3xl font-bold text-gray-900">Why DemandAI?</h2>
      <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
        The only platform that combines enterprise‑grade forecasting, explainability, and instant‑action alerts.
      </p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="Accuracy"
          description="98 % R² on hold‑out data"
          icon={<CheckCircle className="w-6 h-6 text-primary" />}
        />
        <FeatureCard
          title="Speed"
          description="Sub‑ms inference per SKU"
          icon={<Zap className="w-6 h-6 text-primary" />}
        />
        <FeatureCard
          title="Explainability"
          description="SHAP‑driven insights per forecast"
          icon={<CheckCircle className="w-6 h-6 text-primary" />}
        />
        <FeatureCard
          title="Scalability"
          description="Millions of forecasts daily"
          icon={<Clock className="w-6 h-6 text-primary" />}
        />
        <FeatureCard
          title="Integrations"
          description="REST, GraphQL, Webhooks"
          icon={<CheckCircle className="w-6 h-6 text-primary" />}
        />
        <FeatureCard
          title="Support"
          description="24/7 Slack & email assistance"
          icon={<CheckCircle className="w-6 h-6 text-primary" />}
        />
      </div>
    </div>
  </section>
);

const FeatureCard = ({ title, description, icon }: CardProps) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    className="bg-gray-50 rounded-xl p-6 shadow-sm text-left"
  >
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h4 className="text-lg font-semibold">{title}</h4>
    </div>
    <p className="text-sm text-gray-600">{description}</p>
  </motion.div>
);
