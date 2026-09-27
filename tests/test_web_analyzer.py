import unittest
from tooling.experience.source_analyzers.web import analyze_web

SAMPLE = '''
import React from "react";
import { Link, Route } from "react-router-dom";

const ProductCard = ({ title, price, onAdd }) => {
  return (
    <div className="rounded-lg bg-white p-4 text-gray-900 border border-gray-200">
      <img src="/product.png" alt={title} />
      <h3 className="text-lg font-semibold">{title}</h3>
      <span className="text-brand-600">{price}</span>
      <button onClick={onAdd} className="bg-teal-500 text-white">Add</button>
      <Link to="/product/1">View</Link>
    </div>
  );
};

export default function HomePage() {
  return (
    <nav className="bg-brand-700">
      <Route path="/home" element={<Home />} />
      <Route path="/cart" element={<Cart />} />
    </nav>
  );
}
'''

class WebAnalyzerTests(unittest.TestCase):
    def test_extracts_components(self):
        r = analyze_web(SAMPLE)
        names = {c["name"] for c in r["components"]}
        self.assertIn("ProductCard", names)
        self.assertIn("HomePage", names)

    def test_extracts_colors_and_tokens(self):
        r = analyze_web(SAMPLE)
        self.assertTrue(any("teal" in t for t in r["tailwind_tokens"]))
        self.assertTrue(any("brand" in t or "gray" in t for t in r["tailwind_tokens"]))

    def test_extracts_routes(self):
        r = analyze_web(SAMPLE)
        self.assertIn("/home", r["navigation"])
        self.assertIn("/cart", r["navigation"])
        self.assertIn("/product/1", r["navigation"])

    def test_screen_role(self):
        r = analyze_web(SAMPLE)
        home = next(c for c in r["components"] if c["name"] == "HomePage")
        self.assertTrue(home["screen"])
        card = next(c for c in r["components"] if c["name"] == "ProductCard")
        self.assertEqual(card["role"], "product")

if __name__ == "__main__":
    unittest.main()
