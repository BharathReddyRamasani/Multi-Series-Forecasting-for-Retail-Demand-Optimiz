import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "./Avatar";

type Testimonial = {
  quote: string;
  author: string;
  company: string;
  avatar: string; // URL
};

const data: Testimonial[] = [
  {
    quote:
      "DemandAI cut our stock‑out rate by 45 % in the first month – the ROI was immediate.",
    author: "Jane Doe",
    company: "RetailCo",
    avatar: "/avatars/jane.jpg",
  },
  {
    quote:
      "The explainability layer gave our merchandisers confidence they’d never had before.",
    author: "John Smith",
    company: "ShopSmart",
    avatar: "/avatars/john.jpg",
  },
  {
    quote:
      "Our forecasting pipeline went from hours to sub‑seconds, unlocking new real‑time use‑cases.",
    author: "Emily Lin",
    company: "FastMart",
    avatar: "/avatars/emily.jpg",
  },
];

export const TestimonialCarousel = () => {
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => (i + 1) % data.length);
  const prev = () => setIdx((i) => (i - 1 + data.length) % data.length);

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900">What our customers say</h2>

        <div className="relative mt-10">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl p-8 shadow-md"
            >
              <p className="text-lg italic text-gray-800">“{data[idx].quote}”</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Avatar src={data[idx].avatar} alt={data[idx].author} />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{data[idx].author}</p>
                  <p className="text-sm text-gray-500">{data[idx].company}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="p-2 rounded-full bg-white/80 hover:bg-white shadow"
            >
              ◀
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="p-2 rounded-full bg-white/80 hover:bg-white shadow"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
