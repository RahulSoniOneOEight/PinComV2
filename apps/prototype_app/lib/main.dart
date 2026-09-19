import 'package:agency_flutter_ui/agency_flutter_ui.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const PrototypeApp());
}

class PrototypeApp extends StatelessWidget {
  const PrototypeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PinCommerce Prototype',
      theme: AgencyTheme.light(),
      home: const PrototypeHomePage(),
    );
  }
}

class PrototypeHomePage extends StatelessWidget {
  const PrototypeHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    const fixture = CommerceFixture.defaultState;
    return Scaffold(
      appBar: AppBar(title: const Text('PinCommerce')),
      body: ListView(
        padding: const EdgeInsets.all(AgencySpacing.lg),
        children: const [
          Text('Direction A · Discovery-first', style: AgencyText.title),
          SizedBox(height: AgencySpacing.md),
          ProductCard(
            title: 'Reference Product',
            priceLabel: '₹1,999',
            state: fixture,
          ),
        ],
      ),
    );
  }
}
