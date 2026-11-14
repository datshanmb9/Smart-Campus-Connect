import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/complaint_model.dart';
import '../../providers/announcements_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/complaints_provider.dart';
import '../../providers/events_provider.dart';
import '../../providers/notifications_provider.dart';
import '../announcements/announcements_screen.dart';
import '../bookings/resource_booking_screen.dart';
import '../complaints/complaint_detail_screen.dart';
import '../complaints/my_complaints_screen.dart';
import '../complaints/report_issue_screen.dart';
import '../events/events_list_screen.dart';
import '../lost_found/lost_found_screen.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';
import '../qr_scanner/qr_scanner_screen.dart';

class StudentDashboardScreen extends StatefulWidget {
  const StudentDashboardScreen({super.key});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDashboardData();
    });
  }

  Future<void> _loadDashboardData() async {
    final comp = Provider.of<ComplaintsProvider>(context, listen: false);
    final ann = Provider.of<AnnouncementsProvider>(context, listen: false);
    final evt = Provider.of<EventsProvider>(context, listen: false);
    final notif = Provider.of<NotificationsProvider>(context, listen: false);
    final book = Provider.of<BookingsProvider>(context, listen: false);

    await Future.wait([
      comp.fetchMyComplaints(),
      ann.fetchAnnouncements(),
      evt.fetchEvents(),
      notif.fetchNotifications(),
      book.fetchMyBookings(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      _buildHomeView(),
      const MyComplaintsScreen(),
      const EventsListScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: AppTheme.textSecondary,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment),
            label: 'Complaints',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.event_outlined),
            activeIcon: Icon(Icons.event),
            label: 'Events',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primaryColor,
        elevation: 4,
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const QrScannerScreen()),
          );
        },
        child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }

  Widget _buildHomeView() {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final notif = Provider.of<NotificationsProvider>(context);
    final complaints = Provider.of<ComplaintsProvider>(context).complaints;
    final announcements = Provider.of<AnnouncementsProvider>(context).announcements;
    final events = Provider.of<EventsProvider>(context).events;

    ComplaintModel? latestActiveComplaint;
    for (final c in complaints) {
      if (c.status != 'Resolved' && c.status != 'Rejected') {
        latestActiveComplaint = c;
        break;
      }
    }

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 12,
        leading: Padding(
          padding: const EdgeInsets.only(left: 14),
          child: GestureDetector(
            onTap: () => setState(() => _currentIndex = 3),
            child: CircleAvatar(
              radius: 18,
              backgroundColor: AppTheme.primaryColor,
              backgroundImage: (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty)
                  ? NetworkImage(ApiConstants.fullImageUrl(user.avatarUrl)!)
                  : null,
              child: (user?.avatarUrl == null || user!.avatarUrl!.isEmpty)
                  ? Text(
                      (user?.fullName.isNotEmpty == true) ? user!.fullName[0].toUpperCase() : 'S',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    )
                  : null,
            ),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hello, ${user?.fullName.split(' ').first ?? 'Student'} 👋',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              '${user?.department ?? 'Computer Applications'} • ${user?.registrationNumber ?? ''}',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
          ],
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                  );
                },
              ),
              if (notif.unreadCount > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppTheme.errorColor,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      '${notif.unreadCount}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero QR Feature Card
              _buildHeroQrCard(),
              const SizedBox(height: 18),

              // Active Ticket Progress Banner (if exists)
              if (latestActiveComplaint != null) ...[
                _buildActiveComplaintBanner(latestActiveComplaint),
                const SizedBox(height: 18),
              ],

              // Quick Actions Grid
              const Text(
                'Campus Services',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              _buildQuickServicesGrid(),
              const SizedBox(height: 20),

              // Latest Campus Announcements Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Campus Notices',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const AnnouncementsScreen()),
                      );
                    },
                    child: const Text('View All'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              _buildAnnouncementsPreview(announcements),
              const SizedBox(height: 20),

              // Upcoming Events Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Upcoming Events',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _currentIndex = 2),
                    child: const Text('Explore'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              _buildEventsPreview(events),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroQrCard() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primaryColor, AppTheme.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Smart QR Issue Reporting',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'One tap facility resolution',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'Found broken equipment, lighting, projector, or Wi-Fi fault? Scan the classroom QR code to auto-detect location and file a complaint in seconds.',
            style: TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppTheme.primaryColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const QrScannerScreen()),
              );
            },
            icon: const Icon(Icons.camera_alt_outlined, size: 18),
            label: const Text(
              'Scan Classroom QR Code',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveComplaintBanner(ComplaintModel c) {
    Color statusColor = AppTheme.statusColor(c.status);

    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ComplaintDetailScreen(complaintId: c.id),
          ),
        );
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: statusColor.withOpacity(0.4), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.pending_actions, size: 18, color: AppTheme.primaryColor),
                const SizedBox(width: 8),
                const Text(
                  'ACTIVE TICKET STATUS',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    c.status,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              c.title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              '${c.ticketNumber} • ${c.venueDisplay}',
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickServicesGrid() {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      children: [
        _buildServiceTile(
          icon: Icons.qr_code_scanner,
          title: 'Scan QR',
          color: AppTheme.primaryColor,
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const QrScannerScreen()),
            );
          },
        ),
        _buildServiceTile(
          icon: Icons.edit_note,
          title: 'Manual Issue',
          color: Colors.blue.shade700,
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ReportIssueScreen()),
            );
          },
        ),
        _buildServiceTile(
          icon: Icons.meeting_room,
          title: 'Book Room',
          color: Colors.teal,
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ResourceBookingScreen()),
            );
          },
        ),
        _buildServiceTile(
          icon: Icons.search,
          title: 'Lost & Found',
          color: Colors.orange.shade800,
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const LostFoundScreen()),
            );
          },
        ),
        _buildServiceTile(
          icon: Icons.event,
          title: 'Workshops',
          color: AppTheme.secondaryColor,
          onTap: () => setState(() => _currentIndex = 2),
        ),
        _buildServiceTile(
          icon: Icons.campaign,
          title: 'Notices',
          color: Colors.purple,
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AnnouncementsScreen()),
            );
          },
        ),
      ],
    );
  }

  Widget _buildServiceTile({
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: color.withOpacity(0.12),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnnouncementsPreview(List announcements) {
    if (announcements.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No new circulars at this time.',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
          ),
        ),
      );
    }

    final top3 = announcements.take(3).toList();

    return Column(
      children: top3.map((a) {
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Icon(
              a.isUrgent ? Icons.error_outline : Icons.info_outline,
              color: a.isUrgent ? Colors.red : AppTheme.primaryColor,
            ),
            title: Text(
              a.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              DateFormat('dd MMM').format(a.createdAt),
              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
            ),
            trailing: const Icon(Icons.chevron_right, size: 18),
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AnnouncementsScreen()),
              );
            },
          ),
        );
      }).toList(),
    );
  }

  Widget _buildEventsPreview(List events) {
    if (events.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No upcoming events scheduled.',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
          ),
        ),
      );
    }

    final top2 = events.take(2).toList();

    return Column(
      children: top2.map((e) {
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: AppTheme.secondaryColor.withOpacity(0.12),
              child: const Icon(Icons.event, color: AppTheme.secondaryColor, size: 20),
            ),
            title: Text(
              e.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              '${DateFormat('dd MMM').format(e.eventDate)} • ${e.venue}',
              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 14),
            onTap: () => setState(() => _currentIndex = 2),
          ),
        );
      }).toList(),
    );
  }
}

