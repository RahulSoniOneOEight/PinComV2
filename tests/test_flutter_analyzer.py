import unittest
from tooling.experience.source_analyzers.flutter import analyze_dart

SAMPLE = '''
import 'package:flutter/material.dart';

class ProductCard extends StatelessWidget {
  final String title;
  final double price;
  final VoidCallback onTap;
  const ProductCard({super.key, required this.title, required this.price, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Text(title, style: TextStyle(fontSize: 16, color: Color(0xFF17181A))),
          Text('price', style: TextStyle(fontSize: 14, color: Color(0xFF067647))),
          ElevatedButton(onPressed: onTap, child: Text('Add')),
        ],
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  void _openProduct() {
    Navigator.pushNamed(context, 'product-detail');
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Column(children: []));
  }
}
'''

class FlutterAnalyzerTests(unittest.TestCase):
    def test_extracts_widget_components(self):
        r = analyze_dart(SAMPLE)
        names = {c["name"] for c in r["components"]}
        self.assertIn("ProductCard", names)
        self.assertIn("HomePage", names)
        self.assertNotIn("_HomePageState", names)  # State classes aren't widgets

    def test_extracts_props(self):
        r = analyze_dart(SAMPLE)
        card = next(c for c in r["components"] if c["name"] == "ProductCard")
        self.assertIn("title", card["props"])
        self.assertIn("price", card["props"])
        self.assertIn("onTap", card["props"])

    def test_extracts_colors_and_font_sizes(self):
        r = analyze_dart(SAMPLE)
        self.assertIn("#17181A", r["colors"].values())
        self.assertIn("#067647", r["colors"].values())
        self.assertIn(16, r["font_sizes"])
        self.assertIn(14, r["font_sizes"])

    def test_extracts_screen_and_navigation(self):
        r = analyze_dart(SAMPLE)
        self.assertTrue(r["has_scaffold"])
        self.assertIn("product-detail", r["navigation"])

    def test_role_inference(self):
        r = analyze_dart(SAMPLE)
        card = next(c for c in r["components"] if c["name"] == "ProductCard")
        self.assertEqual(card["role"], "product")

if __name__ == "__main__":
    unittest.main()
