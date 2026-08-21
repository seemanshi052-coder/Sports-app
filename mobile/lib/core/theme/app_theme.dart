import 'package:flutter/material.dart';

class AppTheme {
  // Muted, sophisticated color palette for a sports-performance product
  static const Color primaryGreen = Color(0xFF14B8A6);  // softer teal-green
  static const Color primaryGreenDark = Color(0xFF0F766E);  // darker tone
  static const Color darkBg = Color(0xFF111827);  // warmer off-black
  static const Color cardBg = Color(0xFF1E293B);
  static const Color cardBorder = Color(0xFF475569);  // lighter gray border
  static const Color textMuted = Color(0xFF98A29E);  // warm gray
  static const Color surfaceBg = Color(0xFF1E293B);
  static const Color accentAmber = Color(0xFFF59E0B);  // muted amber for status
  static const Color accentRed = Color(0xFFEF4444);  // muted red

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      colorScheme: const ColorScheme.dark(
        primary: primaryGreen,
        secondary: primaryGreenDark,
        surface: cardBg,
        background: darkBg,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBg,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,  // reduced from w700
          letterSpacing: -0.2,
        ),
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),  // reduced from 16, more modest
          side: BorderSide(color: cardBorder, width: 0.5),  // thinner, subtle border
        ),
        elevation: 0,  // no shadow
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryGreen,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),  // more modest radius
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: const TextStyle(
            fontSize: 15,  // slightly smaller
            fontWeight: FontWeight.w600,  // w600 instead of w700
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardBg,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: cardBorder, width: 0.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: cardBorder, width: 0.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: primaryGreen, width: 1),
        ),
      ),
    );
}
}
