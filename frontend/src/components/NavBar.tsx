import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { Menu, X, Zap, BookOpen, Users, DollarSign, HelpCircle } from "lucide-react";

export const NavBar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shrink, setShrink] = useState(false);
  const controls = useAnimation();

  // shrink the bar after scrolling 40px
  useEffect(() => {
    const onScroll = () => setShrink(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // animate the bar height
  useEffect(() => {
    controls.start({ height: shrink ? "4rem" : "5rem" });
  }, [shrink, controls]);

  return (
    <motion.header
      animate={controls}
      className="fixed inset-x-0 top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-full">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-lg">
          <Zap className="w-6 h-6" />
          <span>DemandAI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted">
          <Link to="/#features" className="hover:text-primary transition-colors">
            Features
          </Link>
          <Link to="/#solutions" className="hover:text-primary transition-colors">
            Solutions
          </Link>
          <Link to="/#pricing" className="hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link to="/#docs" className="hover:text-primary transition-colors">
            Docs
          </Link>
          <Link to="/#contact" className="hover:text-primary transition-colors">
            Contact
          </Link>
        </nav>

        {/* CTA & login */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-muted hover:text-primary transition-colors text-sm"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="bg-primary text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-primary/90 transition"
          >
            Get Started
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <motion.nav
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: mobileOpen ? "auto" : 0,
          opacity: mobileOpen ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
      >
        <div className="flex flex-col gap-4 p-4 text-sm">
          <Link to="/#features" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">
            Features
          </Link>
          <Link to="/#solutions" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">
            Solutions
          </Link>
          <Link to="/#pricing" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link to="/#docs" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">
            Docs
          </Link>
          <Link to="/#contact" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">
            Contact
          </Link>
        </div>
      </motion.nav>
    </motion.header>
  );
};
