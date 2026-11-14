import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';
import '../core/constants/api_constants.dart';

class NotificationsProvider with ChangeNotifier {
  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();

    final res = await ApiService.get(ApiConstants.notifications);
    _isLoading = false;

    if (res.success && res.data != null) {
      _unreadCount = res.data['unreadCount'] ?? 0;
      if (res.data['notifications'] != null) {
        _notifications = (res.data['notifications'] as List)
            .map((n) => NotificationModel.fromJson(n as Map<String, dynamic>))
            .toList();
      }
    }
    notifyListeners();
  }

  Future<void> markAsRead(String id) async {
    final res = await ApiService.put(ApiConstants.readNotification(id));
    if (res.success) {
      final index = _notifications.indexWhere((n) => n.id == id);
      if (index != -1 && !_notifications[index].isRead) {
        _unreadCount = (_unreadCount > 0) ? _unreadCount - 1 : 0;
        _notifications[index] = NotificationModel(
          id: _notifications[index].id,
          title: _notifications[index].title,
          message: _notifications[index].message,
          type: _notifications[index].type,
          isRead: true,
          relatedEntityId: _notifications[index].relatedEntityId,
          createdAt: _notifications[index].createdAt,
        );
        notifyListeners();
      }
    }
  }

  Future<void> markAllAsRead() async {
    final res = await ApiService.put(ApiConstants.readAllNotifications);
    if (res.success) {
      _unreadCount = 0;
      _notifications = _notifications
          .map((n) => NotificationModel(
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type,
                isRead: true,
                relatedEntityId: n.relatedEntityId,
                createdAt: n.createdAt,
              ))
          .toList();
      notifyListeners();
    }
  }
}

