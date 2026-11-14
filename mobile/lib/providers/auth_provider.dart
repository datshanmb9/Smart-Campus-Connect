import 'dart:io';
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../core/constants/api_constants.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;
  bool _requiresApproval = false;
  String? _successMessage;

  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get requiresApproval => _requiresApproval;
  String? get successMessage => _successMessage;

  Future<bool> restoreSession() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await ApiService.getToken();
      if (token == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final res = await ApiService.get(ApiConstants.me);
      if (res.success && res.data != null && res.data['user'] != null) {
        _user = UserModel.fromJson(res.data['user']);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        await ApiService.clearSession();
        _user = null;
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (_) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await ApiService.post(ApiConstants.login, {
      'email': email.trim(),
      'password': password,
    });

    _isLoading = false;

    if (res.success && res.data != null) {
      final token = res.data['token'];
      final userJson = res.data['user'];
      _requiresApproval = res.data['requiresApproval'] == true;
      _successMessage = res.message;

      if (token != null && userJson != null) {
        _user = UserModel.fromJson(userJson);
        await ApiService.saveSession(token, userJson);
      }
      notifyListeners();
      return true;
    } else {
      _errorMessage = res.message;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String password,
    required String registrationNumber,
    required String department,
    String? phone,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await ApiService.post(ApiConstants.register, {
      'fullName': fullName.trim(),
      'email': email.trim(),
      'password': password,
      'role': 'student',
      'registrationNumber': registrationNumber.toUpperCase().trim(),
      'department': department.trim(),
      'phone': phone ?? '',
    });

    _isLoading = false;

    if (res.success && res.data != null) {
      final token = res.data['token'];
      final userJson = res.data['user'];
      _requiresApproval = res.data['requiresApproval'] == true;
      _successMessage = res.message;

      if (token != null && userJson != null) {
        _user = UserModel.fromJson(userJson);
        await ApiService.saveSession(token, userJson);
      }
      notifyListeners();
      return true;
    } else {
      _errorMessage = res.message;
      notifyListeners();
      return false;
    }
  }

  Future<bool> uploadProfilePhoto(File imageFile) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService.multipartPost(
        url: ApiConstants.uploadAvatar,
        fields: {},
        filePath: imageFile.path,
        fileField: 'avatar',
      );

      _isLoading = false;

      if (res.success && res.data != null) {
        final userJson = res.data['user'];
        if (userJson != null) {
          _user = UserModel.fromJson(userJson);
          final token = await ApiService.getToken();
          if (token != null) {
            await ApiService.saveSession(token, userJson);
          }
        }
        notifyListeners();
        return true;
      } else {
        _errorMessage = res.message;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Failed to upload photo: $e';
      notifyListeners();
      return false;
    }
  }

  Future<bool> removeProfilePhoto() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService.delete(ApiConstants.removeAvatar);
      _isLoading = false;

      if (res.success) {
        if (res.data != null && res.data['user'] != null) {
          _user = UserModel.fromJson(res.data['user']);
        } else if (_user != null) {
          _user = UserModel(
            id: _user!.id,
            fullName: _user!.fullName,
            email: _user!.email,
            role: _user!.role,
            department: _user!.department,
            registrationNumber: _user!.registrationNumber,
            employeeId: _user!.employeeId,
            phone: _user!.phone,
            avatarUrl: '',
            academicYear: _user!.academicYear,
            section: _user!.section,
            approvalStatus: _user!.approvalStatus,
          );
        }
        final token = await ApiService.getToken();
        if (token != null && _user != null) {
          await ApiService.saveSession(token, _user!.toJson());
        }
        notifyListeners();
        return true;
      } else {
        _errorMessage = res.message;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Failed to remove photo: $e';
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await ApiService.clearSession();
    _user = null;
    notifyListeners();
  }
}

