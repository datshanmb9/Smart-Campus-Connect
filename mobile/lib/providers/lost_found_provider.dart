import 'package:flutter/material.dart';
import '../models/lost_found_model.dart';
import '../services/api_service.dart';
import '../core/constants/api_constants.dart';

class LostFoundProvider with ChangeNotifier {
  List<LostFoundModel> _items = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<LostFoundModel> get items => _items;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchItems({String? type, String? category}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    String url = ApiConstants.lostFound;
    final queryParams = <String>[];
    if (type != null) queryParams.add('type=$type');
    if (category != null) queryParams.add('category=$category');
    if (queryParams.isNotEmpty) {
      url += '?${queryParams.join('&')}';
    }

    final res = await ApiService.get(url);
    _isLoading = false;

    if (res.success && res.data != null && res.data['items'] != null) {
      _items = (res.data['items'] as List)
          .map((i) => LostFoundModel.fromJson(i as Map<String, dynamic>))
          .toList();
    } else {
      _errorMessage = res.message;
    }
    notifyListeners();
  }

  Future<bool> reportItem({
    required String type,
    required String title,
    required String category,
    required String description,
    required String location,
    required DateTime itemDate,
    String? imagePath,
    bool isContactVisible = false,
  }) async {
    _isLoading = true;
    notifyListeners();

    final fields = <String, String>{
      'type': type,
      'title': title.trim(),
      'category': category,
      'description': description.trim(),
      'location': location.trim(),
      'itemDate': itemDate.toIso8601String(),
      'isContactVisible': isContactVisible.toString(),
    };

    final res = await ApiService.multipartPost(
      url: ApiConstants.lostFound,
      fields: fields,
      filePath: imagePath,
      fileField: 'image',
    );

    _isLoading = false;
    notifyListeners();

    if (res.success) {
      await fetchItems();
      return true;
    }
    return false;
  }

  Future<bool> claimItem(String id, String claimNotes) async {
    final res = await ApiService.put(ApiConstants.claimLostFound(id), {
      'claimNotes': claimNotes.trim(),
    });
    if (res.success) {
      await fetchItems();
      return true;
    }
    return false;
  }
}

