import 'package:flutter/material.dart';
import '../models/complaint_model.dart';
import '../models/location_model.dart';
import '../services/api_service.dart';
import '../core/constants/api_constants.dart';

class ComplaintsProvider with ChangeNotifier {
  List<ComplaintModel> _complaints = [];
  List<LocationModel> _locations = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<ComplaintModel> get complaints => _complaints;
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

  Future<void> fetchMyComplaints() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await ApiService.get(ApiConstants.myComplaints);
    _isLoading = false;

    if (res.success && res.data != null && res.data['complaints'] != null) {
      _complaints = (res.data['complaints'] as List)
          .map((c) => ComplaintModel.fromJson(c as Map<String, dynamic>))
          .toList();
    } else {
      _errorMessage = res.message;
    }
    notifyListeners();
  }

  Future<LocationModel?> resolveLocationByQr(String qrCode) async {
    final res = await ApiService.get(ApiConstants.locationByQr(qrCode.trim()));
    if (res.success && res.data != null && res.data['location'] != null) {
      return LocationModel.fromJson(res.data['location']);
    }
    return null;
  }

  Future<ComplaintModel?> fetchComplaintDetails(String id) async {
    final res = await ApiService.get(ApiConstants.complaintDetails(id));
    if (res.success && res.data != null && res.data['complaint'] != null) {
      return ComplaintModel.fromJson(
        res.data['complaint'],
        res.data['history'] as List<dynamic>?,
      );
    }
    return null;
  }

  Future<Map<String, dynamic>> submitComplaint({
    String? locationId,
    Map<String, String>? manualLocation,
    required String category,
    required String title,
    required String description,
    String priority = 'Medium',
    String? imagePath,
  }) async {
    _isLoading = true;
    notifyListeners();

    final fields = <String, String>{
      'category': category,
      'title': title.trim(),
      'description': description.trim(),
      'priority': priority,
    };

    if (locationId != null && locationId.isNotEmpty) {
      fields['locationId'] = locationId;
    }

    if (manualLocation != null) {
      if (manualLocation['buildingName'] != null) {
        fields['manualLocation[buildingName]'] = manualLocation['buildingName']!;
      }
      if (manualLocation['roomNumber'] != null) {
        fields['manualLocation[roomNumber]'] = manualLocation['roomNumber']!;
      }
      if (manualLocation['landmark'] != null) {
        fields['manualLocation[landmark]'] = manualLocation['landmark']!;
      }
    }

    final res = await ApiService.multipartPost(
      url: ApiConstants.complaints,
      fields: fields,
      filePath: imagePath,
      fileField: 'image',
    );

    _isLoading = false;
    notifyListeners();

    if (res.success && res.data != null && res.data['complaint'] != null) {
      final newComplaint = ComplaintModel.fromJson(res.data['complaint']);
      _complaints.insert(0, newComplaint);
      notifyListeners();
      return {
        'success': true,
        'ticketNumber': newComplaint.ticketNumber,
        'complaint': newComplaint,
      };
    } else {
      return {
        'success': false,
        'message': res.message,
      };
    }
  }
}

