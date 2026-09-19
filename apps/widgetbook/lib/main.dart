import 'package:agency_flutter_ui/agency_flutter_ui.dart';
import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

void main() => runApp(const AgencyWidgetbook());

class AgencyWidgetbook extends StatelessWidget {
  const AgencyWidgetbook({super.key});

  @override
  Widget build(BuildContext context) {
    return Widgetbook.material(
      directories: [
        WidgetbookComponent(
          name: 'ProductCard',
          useCases: [
            WidgetbookUseCase(
              name: 'Default',
              builder: (_) => const Padding(
                padding: EdgeInsets.all(AgencySpacing.lg),
                child: ProductCard(
                  title: 'Reference Product',
                  priceLabel: '₹1,999',
                ),
              ),
            ),
            WidgetbookUseCase(
              name: 'Loading',
              builder: (_) => const Padding(
                padding: EdgeInsets.all(AgencySpacing.lg),
                child: ProductCard(
                  title: 'Reference Product',
                  priceLabel: '₹1,999',
                  state: CommerceFixture.loading,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
