import { motion } from "framer-motion";
import { ReactNode } from "react";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    className="bg-white rounded-xl shadow-sm p-6 text-center transition-colors hover:bg-gray-50"
  >
    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 text-primary bg-primary/10 rounded-full">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mt-2 text-sm text-gray-600">{description}</p>
  </motion.div>
);
