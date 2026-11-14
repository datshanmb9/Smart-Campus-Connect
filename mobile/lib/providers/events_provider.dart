import 'package:flutter/material.dart';
import '../models/event_model.dart';
import '../services/api_service.dart';
import '../core/constants/api_constants.dart';

class EventsProvider with ChangeNotifier {
  List<EventModel> _events = [];
  List<EventRegistrationModel> _myRegistrations = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<EventModel> get events => _events;
  List<EventRegistrationModel> get myRegistrations => _myRegistrations;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchEvents() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await ApiService.get(ApiConstants.events);
    _isLoading = false;

    if (res.success && res.data != null && res.data['events'] != null) {
      _events = (res.data['events'] as List)
          .map((e) => EventModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      _errorMessage = res.message;
    }
    notifyListeners();
  }

  Future<void> fetchMyRegistrations() async {
    final res = await ApiService.get(ApiConstants.myRegistrations);
    if (res.success && res.data != null && res.data['registrations'] != null) {
      _myRegistrations = (res.data['registrations'] as List)
          .map((r) => EventRegistrationModel.fromJson(r as Map<String, dynamic>))
          .toList();
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> registerForEvent(String eventId) async {
    _isLoading = true;
    notifyListeners();

    final res = await ApiService.post(ApiConstants.registerEvent(eventId), {});
    _isLoading = false;
    notifyListeners();

    if (res.success && res.data != null) {
      final ticketCode = res.data['ticketCode'];
      await fetchMyRegistrations();
      await fetchEvents();
      return {'success': true, 'ticketCode': ticketCode};
    } else {
      return {'success': false, 'message': res.message};
    }
  }
}

