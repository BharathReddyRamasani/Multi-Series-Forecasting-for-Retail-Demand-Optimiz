import { motion } from "framer-motion";

export const TrustedBy = () => {
  const logos = [
    { name: "Airbnb", src: "https://cdn.simpleicons.org/airbnb" },
    { name: "Shopify", src: "https://cdn.simpleicons.org/shopify" },
    { name: "Netflix", src: "https://cdn.simpleicons.org/netflix" },
    { name: "Stripe", src: "https://cdn.simpleicons.org/stripe" },
    { name: "Dropbox", src: "https://cdn.simpleicons.org/dropbox" },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-sm font-medium text-gray-500">Trusted by</p>
        <div className="mt-6 flex flex-wrap justify-center gap-8">
          {logos.map((logo) => (
            <motion.img
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              className="h-9 grayscale hover:grayscale-0 transition duration-300"
              whileHover={{ scale: 1.1 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
