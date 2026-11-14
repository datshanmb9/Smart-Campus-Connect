import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../models/notification_model.dart';
import '../../providers/notifications_provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotificationsProvider>(context, listen: false).fetchNotifications();
    });
  }

  IconData _iconForType(String type) {
    switch (type.toLowerCase()) {
      case 'complaint':
        return Icons.assignment_outlined;
      case 'event':
        return Icons.event_outlined;
      case 'booking':
        return Icons.meeting_room_outlined;
      case 'lost_found':
        return Icons.search_outlined;
      case 'announcement':
        return Icons.campaign_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _colorForType(String type) {
    switch (type.toLowerCase()) {
      case 'complaint':
        return AppTheme.primaryColor;
      case 'event':
        return AppTheme.secondaryColor;
      case 'booking':
        return Colors.teal;
      case 'lost_found':
        return Colors.orange;
      case 'announcement':
        return Colors.purple;
      default:
        return AppTheme.primaryColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<NotificationsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (provider.unreadCount > 0)
            TextButton.icon(
              onPressed: () => provider.markAllAsRead(),
              icon: const Icon(Icons.done_all, size: 18),
              label: const Text('Mark All Read'),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => provider.fetchNotifications(),
        child: provider.isLoading && provider.notifications.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : provider.notifications.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_none, size: 64, color: AppTheme.textSecondary),
                        SizedBox(height: 12),
                        Text('No notifications yet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        SizedBox(height: 4),
                        Text('Campus updates and ticket alerts will appear here.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                      ],
                    ),
                  )
                : ListView.separated(
                    itemCount: provider.notifications.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final n = provider.notifications[index];
                      return _buildNotificationTile(n, provider);
                    },
                  ),
      ),
    );
  }

  Widget _buildNotificationTile(NotificationModel n, NotificationsProvider provider) {
    final typeColor = _colorForType(n.type);

    return InkWell(
      onTap: () {
        if (!n.isRead) {
          provider.markAsRead(n.id);
        }
      },
      child: Container(
        color: n.isRead ? Colors.transparent : AppTheme.primaryColor.withOpacity(0.04),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: typeColor.withOpacity(0.12),
              child: Icon(_iconForType(n.type), color: typeColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          n.title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: n.isRead ? FontWeight.w600 : FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                      if (!n.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppTheme.primaryColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    n.message,
                    style: TextStyle(
                      fontSize: 13,
                      color: n.isRead ? AppTheme.textSecondary : const Color(0xFF334155),
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    DateFormat('dd MMM, hh:mm a').format(n.createdAt),
                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

