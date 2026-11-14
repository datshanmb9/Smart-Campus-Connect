import 'package:flutter/material.dart';
import '../models/booking_model.dart';
import '../models/location_model.dart';
import '../services/api_service.dart';
import '../core/constants/api_constants.dart';

class BookingsProvider with ChangeNotifier {
  List<BookingModel> _bookings = [];
  List<LocationModel> _locations = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<BookingModel> get bookings => _bookings;
  List<LocationModel> get locations => _locations;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchLocations() async {
    final res = await ApiService.get(ApiConstants.locations);
    if (res.success && res.data != null && res.data['locations'] != null) {
      _locations = (res.data['locations'] as List)
          .map((l) => LocationModel.fromJson(l as Map<String, dynamic>))
          .toList();
      notifyListeners();
    }
  }

  Future<void> fetchMyBookings() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await ApiService.get(ApiConstants.myBookings);
    _isLoading = false;

    if (res.success && res.data != null && res.data['bookings'] != null) {
      _bookings = (res.data['bookings'] as List)
          .map((b) => BookingModel.fromJson(b as Map<String, dynamic>))
          .toList();
    } else {
      _errorMessage = res.message;
    }
    notifyListeners();
  }

  Future<Map<String, dynamic>> submitBooking({
    required String locationId,
    required String purpose,
    required DateTime bookingDate,
    required String startTime,
    required String endTime,
    int attendeesEstimate = 20,
  }) async {
    _isLoading = true;
    notifyListeners();

    final dateStr = bookingDate.toIso8601String().split('T').first;

    final res = await ApiService.post(ApiConstants.bookings, {
      'locationId': locationId,
      'purpose': purpose.trim(),
      'bookingDate': dateStr,
      'startTime': startTime,
      'endTime': endTime,
      'attendeesEstimate': attendeesEstimate,
    });

    _isLoading = false;
    notifyListeners();

    if (res.success && res.data != null) {
      await fetchMyBookings();
      return {'success': true, 'message': res.message};
    } else {
      return {'success': false, 'message': res.message};
    }
  }

  Future<bool> cancelBooking(String bookingId) async {
    _isLoading = true;
    notifyListeners();

    final res = await ApiService.put('${ApiConstants.bookings}/$bookingId/cancel', {});
    _isLoading = false;

    if (res.success) {
      await fetchMyBookings();
      notifyListeners();
      return true;
    } else {
      _errorMessage = res.message;
      notifyListeners();
      return false;
    }
  }
}

