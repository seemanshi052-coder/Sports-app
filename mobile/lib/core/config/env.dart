class Env {
  // FastAPI Backend URL
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8000/api/v1',
  );

  // Supabase Configuration
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://uehiijbiycuwmyivvruh.supabase.co',
  );

  static const String supabasePublishableKey = String.fromEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
    defaultValue: 'sb_publishable_x3Ov8MhXaDtAsCzOv5kpGQ_wEaO-dd1',
  );

  static const String storageBucket = 'assessment-videos';
}
