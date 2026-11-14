import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';

class ApiResponse {
  final bool success;
  final String message;
  final dynamic data;
  final int statusCode;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    required this.statusCode,
  });
}

class ApiService {
  static const String _tokenKey = 'auth_jwt_token';
  static const String _userKey = 'cached_user_json';

  static String? _cachedToken;

  static Future<void> saveSession(String token, Map<String, dynamic> userJson) async {
    _cachedToken = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(userJson));
  }

  static Future<String?> getToken() async {
    if (_cachedToken != null) return _cachedToken;
    final prefs = await SharedPreferences.getInstance();
    _cachedToken = prefs.getString(_tokenKey);
    return _cachedToken;
  }

  static Future<Map<String, dynamic>?> getCachedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final str = prefs.getString(_userKey);
    if (str != null) {
      try {
        return jsonDecode(str) as Map<String, dynamic>;
      } catch (_) {}
    }
    return null;
  }

  static Future<void> clearSession() async {
    _cachedToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  static Future<Map<String, String>> _headers() async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    final token = await getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static ApiResponse _processResponse(http.Response response) {
    try {
      final body = jsonDecode(response.body);
      final success = body['success'] == true;
      final message = body['message'] ?? (success ? 'Success' : 'Request failed');
      final data = body['data'];

      return ApiResponse(
        success: success,
        message: message.toString(),
        data: data,
        statusCode: response.statusCode,
      );
    } catch (e) {
      return ApiResponse(
        success: response.statusCode >= 200 && response.statusCode < 300,
        message: 'Server response status: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }
  }

  // GET
  static Future<ApiResponse> get(String url) async {
    try {
      print('[ApiService] GET to: $url');
      final headers = await _headers();
      final res = await http.get(Uri.parse(url), headers: headers);
      print('[ApiService] Response status: ${res.statusCode}');
      return _processResponse(res);
    } catch (e) {
      print('[ApiService] Exception: $e');
      return ApiResponse(
        success: false,
        message: 'Connection failed: Cannot reach backend server at ${ApiConstants.baseUrl}. Check IP or WiFi network.',
        statusCode: 500,
      );
    }
  }

  // POST
  static Future<ApiResponse> post(String url, Map<String, dynamic> body) async {
    try {
      print('[ApiService] POST to: $url');
      final headers = await _headers();
      final res = await http.post(
        Uri.parse(url),
        headers: headers,
        body: jsonEncode(body),
      );
      print('[ApiService] Response status: ${res.statusCode}');
      return _processResponse(res);
    } catch (e) {
      print('[ApiService] Exception: $e');
      return ApiResponse(
        success: false,
        message: 'Connection failed: Cannot reach backend server at ${ApiConstants.baseUrl}. Check IP or WiFi network.',
        statusCode: 500,
      );
    }
  }

  // PUT
  static Future<ApiResponse> put(String url, [Map<String, dynamic>? body]) async {
    try {
      final headers = await _headers();
      final res = await http.put(
        Uri.parse(url),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      return _processResponse(res);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Connection failed: $e',
        statusCode: 500,
      );
    }
  }

  // DELETE
  static Future<ApiResponse> delete(String url) async {
    try {
      final headers = await _headers();
      final res = await http.delete(Uri.parse(url), headers: headers);
      return _processResponse(res);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Connection failed: $e',
        statusCode: 500,
      );
    }
  }

  // Multipart File Upload (For complaints and lost/found photos)
  static Future<ApiResponse> multipartPost({
    required String url,
    required Map<String, String> fields,
    String? filePath,
    String fileField = 'image',
  }) async {
    try {
      final token = await getToken();
      final request = http.MultipartRequest('POST', Uri.parse(url));

      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      request.fields.addAll(fields);

      if (filePath != null && filePath.isNotEmpty) {
        final file = File(filePath);
        if (await file.exists()) {
          request.files.add(await http.MultipartFile.fromPath(fileField, filePath));
        }
      }

      final streamedRes = await request.send();
      final res = await http.Response.fromStream(streamedRes);
      return _processResponse(res);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Multipart upload error: $e',
        statusCode: 500,
      );
    }
  }
}

