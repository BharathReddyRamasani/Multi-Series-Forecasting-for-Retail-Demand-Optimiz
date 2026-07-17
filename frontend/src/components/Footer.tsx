import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin } from "lucide-react";

export const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 py-12">
    <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h4 className="text-white font-semibold mb-3">Product</h4>
        <ul className="space-y-2">
          <li><Link to="/#features" className="hover:text-white">Features</Link></li>
          <li><Link to="/#pricing" className="hover:text-white">Pricing</Link></li>
          <li><Link to="/#docs" className="hover:text-white">Docs</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3">Company</h4>
        <ul className="space-y-2">
          <li><Link to="/about" className="hover:text-white">About</Link></li>
          <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
          <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3">Resources</h4>
        <ul className="space-y-2">
          <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
          <li><Link to="/guides" className="hover:text-white">Guides</Link></li>
          <li><Link to="/api" className="hover:text-white">API</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3">Follow us</h4>
        <div className="flex gap-4 mb-4">
          <a href="#" className="hover:text-white"><Facebook className="w-5 h-5" /></a>
          <a href="#" className="hover:text-white"><Twitter className="w-5 h-5" /></a>
          <a href="#" className="hover:text-white"><Linkedin className="w-5 h-5" /></a>
        </div>
        <form className="mt-4">
          <label htmlFor="newsletter" className="sr-only">Newsletter</label>
          <div className="flex">
            <input
              id="newsletter"
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-3 py-2 rounded-l-md bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-r-md hover:bg-primary/90 transition"
            >
              Subscribe
            </button>
          </div>
        </form>
      </div>
    </div>
    <div className="mt-8 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} DemandAI. All rights reserved.
    </div>
  </footer>
);
