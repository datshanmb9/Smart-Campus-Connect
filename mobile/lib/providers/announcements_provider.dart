import 'package:flutter/material.dart';
import '../models/announcement_model.dart';
import '../services/api_service.dart';
import '../core/constants/api_constants.dart';

class AnnouncementsProvider with ChangeNotifier {
  List<AnnouncementModel> _announcements = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<AnnouncementModel> get announcements => _announcements;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchAnnouncements() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await ApiService.get(ApiConstants.announcements);
    _isLoading = false;

    if (res.success && res.data != null && res.data['announcements'] != null) {
      _announcements = (res.data['announcements'] as List)
          .map((a) => AnnouncementModel.fromJson(a as Map<String, dynamic>))
          .toList();
    } else {
      _errorMessage = res.message;
    }
    notifyListeners();
  }
}

