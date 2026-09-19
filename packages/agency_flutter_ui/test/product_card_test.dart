import 'package:agency_flutter_ui/agency_flutter_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('ProductCard renders default state', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ProductCard(
            title: 'Reference Product',
            priceLabel: '₹1,999',
          ),
        ),
      ),
    );

    expect(find.text('Reference Product'), findsOneWidget);
    expect(find.text('₹1,999'), findsOneWidget);
  });

  testWidgets('ProductCard renders loading state', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ProductCard(
            title: 'Reference Product',
            priceLabel: '₹1,999',
            state: CommerceFixture.loading,
          ),
        ),
      ),
    );

    expect(find.byType(LinearProgressIndicator), findsOneWidget);
  });
}
