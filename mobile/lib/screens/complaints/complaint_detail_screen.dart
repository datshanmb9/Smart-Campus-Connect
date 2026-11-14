import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/complaint_model.dart';
import '../../providers/complaints_provider.dart';

class ComplaintDetailScreen extends StatefulWidget {
  final String complaintId;

  const ComplaintDetailScreen({super.key, required this.complaintId});

  @override
  State<ComplaintDetailScreen> createState() => _ComplaintDetailScreenState();
}

class _ComplaintDetailScreenState extends State<ComplaintDetailScreen> {
  ComplaintModel? _complaint;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final provider = Provider.of<ComplaintsProvider>(context, listen: false);
      final details = await provider.fetchComplaintDetails(widget.complaintId);
      if (mounted) {
        setState(() {
          _complaint = details;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load details: $e';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_complaint?.ticketNumber ?? 'Ticket Details'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: AppTheme.errorColor),
                      const SizedBox(height: 12),
                      Text(_error!),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _loadDetails,
                        child: const Text('Try Again'),
                      ),
                    ],
                  ),
                )
              : _complaint == null
                  ? const Center(child: Text('Complaint not found'))
                  : RefreshIndicator(
                      onRefresh: _loadDetails,
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Status Header Banner
                            _buildStatusBanner(_complaint!),
                            const SizedBox(height: 16),

                            // Venue Details Card
                            _buildVenueCard(_complaint!),
                            const SizedBox(height: 16),

                            // Complaint Information Card
                            _buildComplaintInfoCard(_complaint!),
                            const SizedBox(height: 16),

                            // Photo Attachment
                            if (_complaint!.imageUrl != null &&
                                _complaint!.imageUrl!.isNotEmpty) ...[
                              _buildPhotoSection(_complaint!.imageUrl!),
                              const SizedBox(height: 16),
                            ],

                            // Staff Assignment Card
                            _buildStaffAssignmentCard(_complaint!),
                            const SizedBox(height: 16),

                            // Resolution / Rejection Banner
                            if (_complaint!.resolutionNotes != null &&
                                _complaint!.resolutionNotes!.isNotEmpty) ...[
                              _buildResolutionBanner(_complaint!.resolutionNotes!),
                              const SizedBox(height: 16),
                            ],
                            if (_complaint!.rejectionReason != null &&
                                _complaint!.rejectionReason!.isNotEmpty) ...[
                              _buildRejectionBanner(_complaint!.rejectionReason!),
                              const SizedBox(height: 16),
                            ],

                            // Audit History Timeline
                            _buildAuditHistorySection(_complaint!),
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),
                    ),
    );
  }

  Widget _buildStatusBanner(ComplaintModel c) {
    final statusColor = AppTheme.statusColor(c.status);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                c.ticketNumber,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Logged on ${DateFormat('dd MMM yyyy, hh:mm a').format(c.createdAt)}',
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: statusColor,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              c.status,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVenueCard(ComplaintModel c) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.location_on, color: AppTheme.primaryColor, size: 20),
                SizedBox(width: 8),
                Text(
                  'Campus Venue',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
            const Divider(height: 20),
            if (c.location != null) ...[
              Text(
                '${c.location!.roomNumber} – ${c.location!.roomType}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                '${c.location!.buildingName} • ${c.location!.block} • Floor ${c.location!.floor}',
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
              ),
              if (c.location!.qrCode.isNotEmpty) ...[
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'QR Tag: ${c.location!.qrCode}',
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ],
            ] else ...[
              Text(
                '${c.manualRoomNumber ?? 'Classroom'} (${c.manualBuildingName ?? 'Campus'})',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              const Text(
                'Manually reported venue',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildComplaintInfoCard(ComplaintModel c) {
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
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    c.category,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.priorityColor(c.priority).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Priority: ${c.priority}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.priorityColor(c.priority),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              c.title,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 10),
            Text(
              c.description,
              style: const TextStyle(fontSize: 14, color: Color(0xFF475569), height: 1.5),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoSection(String imgPath) {
    final fullUrl = ApiConstants.fullImageUrl(imgPath);
    if (fullUrl == null) return const SizedBox.shrink();

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Icon(Icons.photo, color: AppTheme.primaryColor, size: 18),
                SizedBox(width: 8),
                Text('Attached Photo Evidence', style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          InkWell(
            onTap: () {
              // Fullscreen image viewer
              showDialog(
                context: context,
                builder: (_) => Dialog(
                  insetPadding: const EdgeInsets.all(12),
                  child: Stack(
                    alignment: Alignment.topRight,
                    children: [
                      InteractiveViewer(
                        child: Image.network(
                          fullUrl,
                          fit: BoxFit.contain,
                          loadingBuilder: (_, child, progress) {
                            if (progress == null) return child;
                            return const Center(child: CircularProgressIndicator());
                          },
                          errorBuilder: (_, __, ___) => const Center(child: Text('Failed to load image')),
                        ),
                      ),
                      IconButton(
                        icon: const CircleAvatar(
                          backgroundColor: Colors.black54,
                          child: Icon(Icons.close, color: Colors.white, size: 20),
                        ),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
              );
            },
            child: Container(
              height: 200,
              width: double.infinity,
              color: Colors.black12,
              child: Image.network(
                fullUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.broken_image, color: Colors.grey, size: 40),
                      SizedBox(height: 6),
                      Text('Image not available', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
                loadingBuilder: (_, child, progress) {
                  if (progress == null) return child;
                  return const Center(child: CircularProgressIndicator());
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStaffAssignmentCard(ComplaintModel c) {
    final hasStaff = c.assignedStaffName != null && c.assignedStaffName!.isNotEmpty;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.engineering, color: AppTheme.secondaryColor, size: 20),
                SizedBox(width: 8),
                Text(
                  'Maintenance & Repair Staff',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
            const Divider(height: 20),
            if (hasStaff) ...[
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                    child: Text(
                      c.assignedStaffName![0].toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c.assignedStaffName!,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          c.assignedStaffPhone != null && c.assignedStaffPhone!.isNotEmpty
                              ? 'Contact: ${c.assignedStaffPhone}'
                              : 'Campus Facilities Team',
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ] else ...[
              const Row(
                children: [
                  Icon(Icons.hourglass_empty, size: 18, color: Colors.orange),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Pending assignment by Campus Administrator',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResolutionBanner(String notes) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.successColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.successColor.withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.check_circle, color: AppTheme.successColor, size: 20),
              SizedBox(width: 8),
              Text(
                'Resolution Notes',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.successColor, fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(notes, style: const TextStyle(fontSize: 13, height: 1.4)),
        ],
      ),
    );
  }

  Widget _buildRejectionBanner(String reason) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.errorColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.errorColor.withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.cancel, color: AppTheme.errorColor, size: 20),
              SizedBox(width: 8),
              Text(
                'Rejection Reason',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.errorColor, fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(reason, style: const TextStyle(fontSize: 13, height: 1.4)),
        ],
      ),
    );
  }

  Widget _buildAuditHistorySection(ComplaintModel c) {
    if (c.history.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.history, color: AppTheme.primaryColor, size: 20),
                SizedBox(width: 8),
                Text(
                  'Status Timeline & Audit History',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
            const Divider(height: 20),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: c.history.length,
              itemBuilder: (context, index) {
                final h = c.history[index];
                final isLast = index == c.history.length - 1;

                return IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Timeline indicator column
                      Column(
                        children: [
                          Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: AppTheme.statusColor(h.newStatus),
                              shape: BoxShape.circle,
                            ),
                          ),
                          if (!isLast)
                            Expanded(
                              child: Container(
                                width: 2,
                                color: const Color(0xFFE2E8F0),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(width: 12),
                      // Details column
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    h.newStatus,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: AppTheme.statusColor(h.newStatus),
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    DateFormat('dd MMM, hh:mm a').format(h.timestamp),
                                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                  ),
                                ],
                              ),
                              if (h.changedByName != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  'Updated by ${h.changedByName}',
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                ),
                              ],
                              if (h.actionNotes.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Text(
                                    h.actionNotes,
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF334155)),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

