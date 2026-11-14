import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smart_campus_connect/main.dart';
import 'package:smart_campus_connect/providers/auth_provider.dart';
import 'package:smart_campus_connect/screens/auth/login_screen.dart';

void main() {
  testWidgets('SmartCampusApp renders splash screen branding', (WidgetTester tester) async {
    await tester.pumpWidget(const SmartCampusApp());
    expect(find.text('Smart Campus Connect'), findsOneWidget);
    expect(find.text('MERNOVA X 2026 • Presidency University'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Drain the 1500ms session check timer
    await tester.pump(const Duration(milliseconds: 1600));
  });

  testWidgets('LoginScreen renders form and controls', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(home: LoginScreen()),
      ),
    );
    expect(find.text('Student Sign In'), findsOneWidget);
    expect(find.text('University Student Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text('Auto-Fill Demo Student (Rahul Sharma)'), findsOneWidget);
    expect(find.text('Register Account'), findsOneWidget);
  });
}
