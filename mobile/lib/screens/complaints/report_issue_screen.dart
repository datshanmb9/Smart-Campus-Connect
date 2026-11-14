import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../models/location_model.dart';
import '../../providers/complaints_provider.dart';
import 'my_complaints_screen.dart';

class ReportIssueScreen extends StatefulWidget {
  final LocationModel? prefilledLocation;

  const ReportIssueScreen({super.key, this.prefilledLocation});

  @override
  State<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends State<ReportIssueScreen> {
  final _formKey = GlobalKey<FormState>();

  LocationModel? _selectedLocation;
  bool _useManualLocation = false;
  final TextEditingController _manualBuildingController = TextEditingController();
  final TextEditingController _manualRoomController = TextEditingController();
  final TextEditingController _manualLandmarkController = TextEditingController();

  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  String _selectedCategory = 'Projector';
  String _selectedPriority = 'Medium';
  File? _selectedImage;
  bool _isSubmitting = false;

  final List<String> _categories = [
    'Projector',
    'Electrical',
    'Computer/Lab',
    'Wi-Fi/Network',
    'Furniture',
    'Water/Plumbing',
    'Cleaning/Maintenance',
    'Other',
  ];

  final List<String> _priorities = ['Low', 'Medium', 'High', 'Urgent'];

  @override
  void initState() {
    super.initState();
    _selectedLocation = widget.prefilledLocation;
    if (_selectedLocation == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Provider.of<ComplaintsProvider>(context, listen: false).fetchLocations();
      });
    }
  }

  @override
  void dispose() {
    _manualBuildingController.dispose();
    _manualRoomController.dispose();
    _manualLandmarkController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 85,
      );
      if (picked != null) {
        setState(() {
          _selectedImage = File(picked.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick photo: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _showImageSourcePicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Attach Photo Evidence',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.camera_alt, color: AppTheme.primaryColor),
                title: const Text('Take Photo with Camera'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: AppTheme.secondaryColor),
                title: const Text('Choose from Photo Gallery'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_useManualLocation && _selectedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a campus classroom or location.'),
          backgroundColor: AppTheme.warningColor,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    Map<String, String>? manualLoc;
    if (_useManualLocation) {
      manualLoc = {
        'buildingName': _manualBuildingController.text.trim(),
        'roomNumber': _manualRoomController.text.trim(),
        'landmark': _manualLandmarkController.text.trim(),
      };
    }

    final provider = Provider.of<ComplaintsProvider>(context, listen: false);
    final result = await provider.submitComplaint(
      locationId: _useManualLocation ? null : _selectedLocation?.id,
      manualLocation: manualLoc,
      category: _selectedCategory,
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      priority: _selectedPriority,
      imagePath: _selectedImage?.path,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result['success'] == true) {
      final ticketNum = result['ticketNumber'] ?? 'Assigned';
      _showSuccessDialog(ticketNum);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Failed to submit complaint.'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showSuccessDialog(String ticketNumber) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppTheme.successColor.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: AppTheme.successColor,
                size: 48,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Complaint Registered!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your campus facility issue has been logged into the system.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primaryLight.withOpacity(0.4)),
              ),
              child: Column(
                children: [
                  const Text(
                    'OFFICIAL TICKET NUMBER',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    ticketNumber,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        actions: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.pop(context);
                  },
                  child: const Text('Back to Home'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) => const MyComplaintsScreen(),
                      ),
                    );
                  },
                  child: const Text('View Tickets'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final complaintsProvider = Provider.of<ComplaintsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Campus Issue'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Venue Header Card
              _buildVenueSection(complaintsProvider),
              const SizedBox(height: 20),

              // Category Selector
              const Text(
                'Issue Category *',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.category_outlined),
                ),
                items: _categories.map((cat) {
                  return DropdownMenuItem(value: cat, child: Text(cat));
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedCategory = val);
                },
              ),
              const SizedBox(height: 16),

              // Title Field
              const Text(
                'Issue Summary / Title *',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  hintText: 'e.g., HDMI Projector not displaying video in LH-204',
                  prefixIcon: Icon(Icons.title),
                ),
                validator: (val) {
                  if (val == null || val.trim().length < 5) {
                    return 'Please enter a clear title (at least 5 characters)';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Description Field
              const Text(
                'Detailed Description *',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText:
                      'Describe the fault, symptoms, equipment tag, or specific seat number...',
                  alignLabelWithHint: true,
                ),
                validator: (val) {
                  if (val == null || val.trim().length < 10) {
                    return 'Please provide more details (at least 10 characters)';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Priority Selector
              const Text(
                'Urgency / Priority *',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Row(
                children: _priorities.map((p) {
                  final isSelected = _selectedPriority == p;
                  Color chipColor = AppTheme.textSecondary;
                  if (p == 'Low') chipColor = Colors.blue;
                  if (p == 'Medium') chipColor = Colors.orange;
                  if (p == 'High') chipColor = Colors.deepOrange;
                  if (p == 'Urgent') chipColor = Colors.red;

                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: ChoiceChip(
                        label: Text(
                          p,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? Colors.white : chipColor,
                          ),
                        ),
                        selected: isSelected,
                        selectedColor: chipColor,
                        backgroundColor: chipColor.withOpacity(0.08),
                        onSelected: (selected) {
                          if (selected) setState(() => _selectedPriority = p);
                        },
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // Photo Evidence Attachment
              const Text(
                'Attach Photo Evidence (Optional)',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              _buildPhotoUploadSection(),
              const SizedBox(height: 32),

              // Submit Button
              ElevatedButton(
                onPressed: _isSubmitting ? null : _handleSubmit,
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.send_rounded),
                          SizedBox(width: 8),
                          Text('Submit Complaint Ticket'),
                        ],
                      ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVenueSection(ComplaintsProvider provider) {
    if (_selectedLocation != null && !_useManualLocation) {
      return Card(
        color: AppTheme.primaryColor.withOpacity(0.04),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppTheme.primaryLight, width: 1.5),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.successColor,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.qr_code_scanner, color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text(
                          'QR VERIFIED VENUE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: () {
                      setState(() {
                        _selectedLocation = null;
                        provider.fetchLocations();
                      });
                    },
                    icon: const Icon(Icons.edit, size: 14),
                    label: const Text('Change', style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${_selectedLocation!.roomNumber} – ${_selectedLocation!.roomType}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${_selectedLocation!.buildingName} • ${_selectedLocation!.block} • Floor ${_selectedLocation!.floor}',
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 13,
                ),
              ),
              if (_selectedLocation!.qrCode.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'QR ID: ${_selectedLocation!.qrCode}',
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.location_on, color: AppTheme.primaryColor),
                const SizedBox(width: 8),
                const Text(
                  'Campus Location',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    setState(() => _useManualLocation = !_useManualLocation);
                  },
                  child: Text(
                    _useManualLocation ? 'Choose from list' : 'Unregistered Room?',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (!_useManualLocation) ...[
              DropdownButtonFormField<LocationModel>(
                value: _selectedLocation,
                decoration: const InputDecoration(
                  labelText: 'Select Classroom / Lab',
                  hintText: 'Choose campus venue',
                  prefixIcon: Icon(Icons.meeting_room_outlined),
                ),
                items: provider.locations.map((loc) {
                  return DropdownMenuItem<LocationModel>(
                    value: loc,
                    child: Text('${loc.roomNumber} - ${loc.buildingName} (${loc.block})'),
                  );
                }).toList(),
                onChanged: (loc) {
                  setState(() => _selectedLocation = loc);
                },
              ),
            ] else ...[
              TextFormField(
                controller: _manualBuildingController,
                decoration: const InputDecoration(
                  labelText: 'Building Name *',
                  hintText: 'e.g., Engineering Block 2',
                  prefixIcon: Icon(Icons.apartment),
                ),
                validator: (val) {
                  if (_useManualLocation && (val == null || val.trim().isEmpty)) {
                    return 'Building name is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _manualRoomController,
                decoration: const InputDecoration(
                  labelText: 'Room Number / Area *',
                  hintText: 'e.g., Room 305 or Staircase B',
                  prefixIcon: Icon(Icons.room),
                ),
                validator: (val) {
                  if (_useManualLocation && (val == null || val.trim().isEmpty)) {
                    return 'Room or area is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _manualLandmarkController,
                decoration: const InputDecoration(
                  labelText: 'Nearby Landmark (Optional)',
                  hintText: 'e.g., Opposite Chemistry Lab',
                  prefixIcon: Icon(Icons.near_me),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoUploadSection() {
    if (_selectedImage != null) {
      return Stack(
        children: [
          Container(
            height: 180,
            width: double.infinity,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFD0D7DE)),
              image: DecorationImage(
                image: FileImage(_selectedImage!),
                fit: BoxFit.cover,
              ),
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: CircleAvatar(
              backgroundColor: Colors.black.withOpacity(0.6),
              radius: 18,
              child: IconButton(
                padding: EdgeInsets.zero,
                icon: const Icon(Icons.close, color: Colors.white, size: 20),
                onPressed: () {
                  setState(() => _selectedImage = null);
                },
              ),
            ),
          ),
        ],
      );
    }

    return OutlinedButton.icon(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: const BorderSide(color: Color(0xFFD0D7DE), width: 1.5),
      ),
      onPressed: _showImageSourcePicker,
      icon: const Icon(Icons.add_a_photo_outlined, color: AppTheme.primaryColor),
      label: const Text(
        'Upload Photograph of Fault / Issue',
        style: TextStyle(fontWeight: FontWeight.w600),
      ),
    );
  }
}
