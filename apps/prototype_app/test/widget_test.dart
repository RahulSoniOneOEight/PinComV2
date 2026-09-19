import 'package:flutter_test/flutter_test.dart';
import 'package:prototype_app/main.dart';

void main() {
  testWidgets('prototype renders reference product', (tester) async {
    await tester.pumpWidget(const PrototypeApp());
    expect(find.text('Reference Product'), findsOneWidget);
  });
}
