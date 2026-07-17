import { FAQItem } from "./FAQItem";

const data = [
  {
    question: "What data do you need to forecast?",
    answer: "We work with historical sales, inventory, promotions, and calendar data. A simple CSV with date, store, item, sales is enough.",
  },
  {
    question: "How is model accuracy measured?",
    answer: "We report MAE, MAPE, and R² on a hold‑out set. Our default LightGBM model typically reaches >98 % R² on retail data.",
  },
  {
    question: "Can we run forecasts on‑premise?",
    answer: "Yes – we offer Docker images and a Python SDK for self‑hosted deployments.",
  },
  {
    question: "What SLAs do you provide?",
    answer: "99.9 % uptime SLA with 30‑minute response time for critical incidents.",
  },
];

export const FAQ = () => (
  <section id="faq" className="py-20 bg-gray-50">
    <div className="max-w-4xl mx-auto px-4 text-center">
      <h2 className="text-3xl font-bold text-gray-900">Frequently asked questions</h2>
      <div className="mt-8 space-y-4">
        {data.map((item, i) => (
          <FAQItem key={i} {...item} />
        ))}
      </div>
    </div>
  </section>
);
