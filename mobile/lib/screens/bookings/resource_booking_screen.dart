import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../models/booking_model.dart';
import '../../models/location_model.dart';
import '../../providers/bookings_provider.dart';

class ResourceBookingScreen extends StatefulWidget {
  const ResourceBookingScreen({super.key});

  @override
  State<ResourceBookingScreen> createState() => _ResourceBookingScreenState();
}

class _ResourceBookingScreenState extends State<ResourceBookingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();

  LocationModel? _selectedLocation;
  final TextEditingController _purposeController = TextEditingController();
  final TextEditingController _attendeesController = TextEditingController(text: '25');

  DateTime _bookingDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _startTime = const TimeOfDay(hour: 10, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 12, minute: 0);
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<BookingsProvider>(context, listen: false);
      provider.fetchLocations();
      provider.fetchMyBookings();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _purposeController.dispose();
    _attendeesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _bookingDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked != null) {
      setState(() => _bookingDate = picked);
    }
  }

  Future<void> _pickStartTime() async {
    final picked = await showTimePicker(context: context, initialTime: _startTime);
    if (picked != null) {
      setState(() => _startTime = picked);
    }
  }

  Future<void> _pickEndTime() async {
    final picked = await showTimePicker(context: context, initialTime: _endTime);
    if (picked != null) {
      setState(() => _endTime = picked);
    }
  }

  String _formatTimeOfDay(TimeOfDay tod) {
    final hour = tod.hour.toString().padLeft(2, '0');
    final minute = tod.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a campus room or facility.'),
          backgroundColor: AppTheme.warningColor,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final startStr = _formatTimeOfDay(_startTime);
    final endStr = _formatTimeOfDay(_endTime);
    final attendees = int.tryParse(_attendeesController.text.trim()) ?? 20;

    final provider = Provider.of<BookingsProvider>(context, listen: false);
    final res = await provider.submitBooking(
      locationId: _selectedLocation!.id,
      purpose: _purposeController.text.trim(),
      bookingDate: _bookingDate,
      startTime: startStr,
      endTime: endStr,
      attendeesEstimate: attendees,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Booking request submitted successfully!'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      _purposeController.clear();
      _tabController.animateTo(1);
    } else {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.event_busy, color: AppTheme.errorColor),
              SizedBox(width: 8),
              Text('Booking Slot Unavailable'),
            ],
          ),
          content: Text(
            res['message'] ??
                'This room is already reserved for the selected time slot. Please pick an alternative time or venue.',
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<BookingsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Campus Facility Booking'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(text: 'Reserve Venue', icon: Icon(Icons.add_business, size: 20)),
            Tab(text: 'My Reservations', icon: Icon(Icons.list_alt, size: 20)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Form
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Select Campus Facility / Room *',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<LocationModel>(
                    value: _selectedLocation,
                    decoration: const InputDecoration(
                      hintText: 'Choose facility',
                      prefixIcon: Icon(Icons.meeting_room_outlined),
                    ),
                    items: provider.locations.map((loc) {
                      return DropdownMenuItem<LocationModel>(
                        value: loc,
                        child: Text('${loc.roomNumber} - ${loc.buildingName} (${loc.roomType})'),
                      );
                    }).toList(),
                    onChanged: (loc) {
                      setState(() => _selectedLocation = loc);
                    },
                  ),
                  const SizedBox(height: 16),

                  // Purpose
                  const Text(
                    'Purpose / Event Title *',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _purposeController,
                    decoration: const InputDecoration(
                      hintText: 'e.g., MCA Final Year Project Review & Viva Preparation',
                      prefixIcon: Icon(Icons.notes),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().length < 5) {
                        return 'Please provide a clear purpose (at least 5 characters)';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Date Picker Card
                  const Text(
                    'Reservation Date *',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.calendar_today, color: AppTheme.primaryColor),
                      title: Text(
                        DateFormat('EEEE, dd MMMM yyyy').format(_bookingDate),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      trailing: const Icon(Icons.edit_calendar, color: AppTheme.primaryColor),
                      onTap: _pickDate,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Time Slots
                  const Text(
                    'Time Slot *',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Card(
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                            leading: const Icon(Icons.schedule, color: AppTheme.primaryColor, size: 20),
                            title: const Text('Start Time', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                            subtitle: Text(_formatTimeOfDay(_startTime), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                            onTap: _pickStartTime,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Card(
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                            leading: const Icon(Icons.schedule, color: AppTheme.primaryColor, size: 20),
                            title: const Text('End Time', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                            subtitle: Text(_formatTimeOfDay(_endTime), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                            onTap: _pickEndTime,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Attendees
                  const Text(
                    'Estimated Attendees *',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _attendeesController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      hintText: 'e.g., 25',
                      prefixIcon: Icon(Icons.groups_outlined),
                    ),
                    validator: (val) {
                      if (val == null || int.tryParse(val) == null) {
                        return 'Enter a valid number of attendees';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 28),

                  // Submit Button
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleSubmit,
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.check_circle_outline),
                              SizedBox(width: 8),
                              Text('Submit Reservation Request'),
                            ],
                          ),
                  ),
                ],
              ),
            ),
          ),

          // Tab 2: My Bookings
          RefreshIndicator(
            onRefresh: () => provider.fetchMyBookings(),
            child: provider.isLoading && provider.bookings.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : provider.bookings.isEmpty
                    ? _buildEmptyBookings()
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: provider.bookings.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final b = provider.bookings[index];
                          return _buildBookingCard(b);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyBookings() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.event_seat_outlined, size: 64, color: AppTheme.textSecondary),
          const SizedBox(height: 12),
          const Text(
            'No facility reservations yet.',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 6),
          const Text('Reserve seminar halls, lab slots, or conference rooms easily.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _tabController.animateTo(0),
            child: const Text('Reserve a Room'),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingCard(BookingModel b) {
    Color statusColor = AppTheme.statusColor(b.status);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    b.location?.displayName ?? 'Campus Venue',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    b.status,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              b.purpose,
              style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary, height: 1.3),
            ),
            const Divider(height: 20),
            Row(
              children: [
                const Icon(Icons.calendar_month, size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Text(
                  DateFormat('dd MMM yyyy').format(b.bookingDate),
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.schedule, size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '${b.startTime} - ${b.endTime}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
                const Spacer(),
                const Icon(Icons.group, size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '~${b.attendeesEstimate}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ],
            ),
            if (b.adminRemarks != null && b.adminRemarks!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: b.status == 'Rejected' ? const Color(0xFFFEF2F2) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: b.status == 'Rejected' ? const Color(0xFFFECACA) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      b.status == 'Rejected' ? Icons.error_outline : Icons.admin_panel_settings,
                      size: 14,
                      color: b.status == 'Rejected' ? AppTheme.danger : AppTheme.primaryColor,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        b.status == 'Rejected'
                            ? 'Rejection reason: ${b.adminRemarks}'
                            : 'Admin note: ${b.adminRemarks}',
                        style: TextStyle(
                          fontSize: 12,
                          color: b.status == 'Rejected' ? const Color(0xFF991B1B) : const Color(0xFF334155),
                          fontWeight: b.status == 'Rejected' ? FontWeight.w500 : FontWeight.normal,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (b.status == 'Pending') ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Cancel Booking Request?'),
                        content: Text('Are you sure you want to cancel your reservation request for ${b.resourceName}?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No, Keep')),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
                            onPressed: () => Navigator.pop(ctx, true),
                            child: const Text('Yes, Cancel Request'),
                          ),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      final success = await Provider.of<BookingsProvider>(context, listen: false).cancelBooking(b.id);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(success ? 'Booking request cancelled successfully.' : 'Failed to cancel booking.'),
                            backgroundColor: success ? AppTheme.primaryColor : AppTheme.danger,
                          ),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.cancel_outlined, size: 16, color: AppTheme.danger),
                  label: const Text('Cancel Pending Request', style: TextStyle(color: AppTheme.danger, fontSize: 13)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFFECACA)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
