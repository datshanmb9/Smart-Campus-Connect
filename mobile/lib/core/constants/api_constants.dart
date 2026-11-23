import 'package:shared_preferences/shared_preferences.dart';

class ApiConstants {
  static const String _keyBaseUrl = 'custom_api_base_url';

  // Default addresses:
  static const String defaultPhysicalUrl = 'http://127.0.0.1:5000/api';
  static const String defaultEmulatorUrl = 'http://10.0.2.2:5000/api';
  static const String defaultLocalhostUrl = 'http://127.0.0.1:5000/api';

  static String _currentBaseUrl = defaultPhysicalUrl;

  static String get baseUrl => _currentBaseUrl;
  static String get hostUrl => _currentBaseUrl.replaceAll('/api', '');

  static String? fullImageUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return '$hostUrl$cleanPath';
  }

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_keyBaseUrl);
    if (saved != null && saved.trim().isNotEmpty) {
      _currentBaseUrl = saved.trim();
    } else {
      // Default to physical USB/Wireless ADB reverse endpoint http://127.0.0.1:5000/api
      _currentBaseUrl = defaultPhysicalUrl;
      await prefs.setString(_keyBaseUrl, _currentBaseUrl);
    }
  }

  static Future<void> setBaseUrl(String newUrl) async {
    _currentBaseUrl = newUrl.endsWith('/') ? newUrl.substring(0, newUrl.length - 1) : newUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyBaseUrl, _currentBaseUrl);
  }

  // Endpoints
  static String get login => '$baseUrl/auth/login';
  static String get register => '$baseUrl/auth/register';
  static String get me => '$baseUrl/auth/me';
  static String get updateProfile => '$baseUrl/auth/update-profile';
  static String get uploadAvatar => '$baseUrl/auth/upload-avatar';
  static String get removeAvatar => '$baseUrl/auth/remove-avatar';

  static String get locations => '$baseUrl/locations';
  static String locationByQr(String code) => '$baseUrl/locations/qr/$code';

  static String get complaints => '$baseUrl/complaints';
  static String get myComplaints => '$baseUrl/complaints/my';
  static String complaintDetails(String id) => '$baseUrl/complaints/$id';

  static String get events => '$baseUrl/events';
  static String get myRegistrations => '$baseUrl/events/my-registrations';
  static String registerEvent(String id) => '$baseUrl/events/$id/register';

  static String get bookings => '$baseUrl/bookings';
  static String get myBookings => '$baseUrl/bookings/my';

  static String get lostFound => '$baseUrl/lost-found';
  static String get myLostFound => '$baseUrl/lost-found/my';
  static String claimLostFound(String id) => '$baseUrl/lost-found/$id/claim';

  static String get announcements => '$baseUrl/announcements';
  static String get notifications => '$baseUrl/notifications';
  static String get readAllNotifications => '$baseUrl/notifications/read-all';
  static String readNotification(String id) => '$baseUrl/notifications/$id/read';
}

