library agency_flutter_ui;

import 'package:flutter/material.dart';

abstract final class AgencySpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
}

abstract final class AgencyText {
  static const TextStyle body = TextStyle(fontSize: 16, height: 1.5);
  static const TextStyle label = TextStyle(fontSize: 14, height: 1.4);
  static const TextStyle title = TextStyle(
    fontSize: 24,
    height: 1.25,
    fontWeight: FontWeight.w600,
  );
}

abstract final class AgencyTheme {
  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(seedColor: const Color(0xFF17181A));
    return ThemeData(
      colorScheme: scheme,
      scaffoldBackgroundColor: const Color(0xFFFFFFFF),
      useMaterial3: true,
    );
  }
}

enum CommerceFixture {
  defaultState,
  loading,
  empty,
  failure,
  approvalPending,
  paymentFailed,
}

class ProductCard extends StatelessWidget {
  const ProductCard({
    required this.title,
    required this.priceLabel,
    this.state = CommerceFixture.defaultState,
    super.key,
  });

  final String title;
  final String priceLabel;
  final CommerceFixture state;

  @override
  Widget build(BuildContext context) {
    if (state == CommerceFixture.loading) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(AgencySpacing.md),
          child: LinearProgressIndicator(),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AgencySpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AgencyText.body),
            const SizedBox(height: AgencySpacing.sm),
            Text(priceLabel, style: AgencyText.title),
          ],
        ),
      ),
    );
  }
}
