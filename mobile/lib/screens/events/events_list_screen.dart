import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../models/event_model.dart';
import '../../providers/events_provider.dart';

class EventsListScreen extends StatefulWidget {
  const EventsListScreen({super.key});

  @override
  State<EventsListScreen> createState() => _EventsListScreenState();
}

class _EventsListScreenState extends State<EventsListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<EventsProvider>(context, listen: false);
      provider.fetchEvents();
      provider.fetchMyRegistrations();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister(EventModel event) async {
    final provider = Provider.of<EventsProvider>(context, listen: false);

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Event Registration'),
        content: Text(
          'Register for "${event.title}" on ${DateFormat('dd MMM yyyy').format(event.eventDate)}?\n\nA digital pass ticket will be generated for your entry.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Register Now'),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    final res = await provider.registerForEvent(event.id);

    if (!mounted) return;

    if (res['success'] == true) {
      final code = res['ticketCode'] ?? 'CONFIRMED';
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle_rounded, color: AppTheme.successColor, size: 56),
              const SizedBox(height: 12),
              const Text(
                'Registration Successful!',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 8),
              Text(
                'You are registered for ${event.title}',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.primaryLight),
                ),
                child: Column(
                  children: [
                    const Text('ENTRY TICKET CODE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                    const SizedBox(height: 4),
                    Text(
                      code,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                _tabController.animateTo(1);
              },
              child: const Text('View My Passes'),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Registration failed.'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final eventsProvider = Provider.of<EventsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Campus Events & Workshops'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(text: 'Upcoming Events', icon: Icon(Icons.calendar_month, size: 20)),
            Tab(text: 'My Registrations', icon: Icon(Icons.confirmation_number_outlined, size: 20)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Upcoming Events
          RefreshIndicator(
            onRefresh: () => eventsProvider.fetchEvents(),
            child: eventsProvider.isLoading && eventsProvider.events.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : eventsProvider.events.isEmpty
                    ? _buildEmptyEvents()
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: eventsProvider.events.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final event = eventsProvider.events[index];
                          final isRegistered = eventsProvider.myRegistrations
                              .any((r) => r.event?.id == event.id);

                          return _buildEventCard(event, isRegistered);
                        },
                      ),
          ),

          // Tab 2: My Registrations
          RefreshIndicator(
            onRefresh: () => eventsProvider.fetchMyRegistrations(),
            child: eventsProvider.myRegistrations.isEmpty
                ? _buildEmptyRegistrations()
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: eventsProvider.myRegistrations.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final reg = eventsProvider.myRegistrations[index];
                      return _buildRegistrationCard(reg);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyEvents() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.event_busy, size: 64, color: AppTheme.textSecondary),
          SizedBox(height: 12),
          Text(
            'No upcoming campus events currently scheduled.',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          SizedBox(height: 4),
          Text('Check back soon for university workshops and hackathons!', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildEmptyRegistrations() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.airplane_ticket_outlined, size: 64, color: AppTheme.textSecondary),
          const SizedBox(height: 12),
          const Text(
            'No event registrations yet.',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 8),
          const Text('Browse upcoming events and grab your seat!', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _tabController.animateTo(0),
            child: const Text('Browse Events'),
          ),
        ],
      ),
    );
  }

  Widget _buildEventCard(EventModel event, bool isRegistered) {
    final isFull = event.registeredCount >= event.maxCapacity && event.maxCapacity > 0;
    final pct = event.maxCapacity > 0 ? (event.registeredCount / event.maxCapacity).clamp(0.0, 1.0) : 0.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.secondaryColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    event.category,
                    style: const TextStyle(
                      color: AppTheme.secondaryColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  DateFormat('dd MMM yyyy').format(event.eventDate),
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor, fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              event.title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              event.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.schedule, size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '${event.startTime} - ${event.endTime}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    event.venue,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Capacity Bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: pct,
                minHeight: 6,
                backgroundColor: const Color(0xFFE2E8F0),
                valueColor: AlwaysStoppedAnimation<Color>(
                  pct > 0.85 ? Colors.red : AppTheme.primaryColor,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${event.registeredCount} / ${event.maxCapacity} seats filled',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                if (isRegistered)
                  const Row(
                    children: [
                      Icon(Icons.check_circle, size: 14, color: AppTheme.successColor),
                      SizedBox(width: 4),
                      Text('Registered', style: TextStyle(color: AppTheme.successColor, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  )
                else
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      minimumSize: const Size(80, 36),
                    ),
                    onPressed: isFull ? null : () => _handleRegister(event),
                    child: Text(isFull ? 'Event Full' : 'Register'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRegistrationCard(EventRegistrationModel reg) {
    final ev = reg.event;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.verified, size: 14, color: AppTheme.successColor),
                      SizedBox(width: 4),
                      Text(
                        'CONFIRMED PASS',
                        style: TextStyle(
                          color: AppTheme.successColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    reg.ticketCode,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              ev?.title ?? 'Campus Event',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            if (ev != null) ...[
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 14, color: AppTheme.textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    DateFormat('EEEE, dd MMMM yyyy').format(ev.eventDate),
                    style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    '${ev.venue} (${ev.startTime} - ${ev.endTime})',
                    style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ],
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Booked on ${DateFormat('dd MMM, hh:mm a').format(reg.registeredAt)}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                const Icon(Icons.qr_code_2, size: 24, color: AppTheme.primaryColor),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

