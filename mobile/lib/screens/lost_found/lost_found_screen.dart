import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/lost_found_model.dart';
import '../../providers/lost_found_provider.dart';

class LostFoundScreen extends StatefulWidget {
  const LostFoundScreen({super.key});

  @override
  State<LostFoundScreen> createState() => _LostFoundScreenState();
}

class _LostFoundScreenState extends State<LostFoundScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();

  String _filterType = 'All'; // All, Lost, Found
  final List<String> _categories = [
    'Electronics',
    'Student ID Card',
    'Books & Notebooks',
    'Bags & Wallets',
    'Keys',
    'Eyewear & Accessories',
    'Water Bottle',
    'Clothing',
    'Other Personal Item',
  ];

  // Report Form state
  String _reportType = 'Lost';
  String _selectedCategory = 'Electronics';
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  DateTime _itemDate = DateTime.now();
  File? _reportImage;
  bool _isContactVisible = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LostFoundProvider>(context, listen: false).fetchItems();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, imageQuality: 80);
    if (picked != null) {
      setState(() => _reportImage = File(picked.path));
    }
  }

  Future<void> _handleSubmitReport() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final provider = Provider.of<LostFoundProvider>(context, listen: false);
    final success = await provider.reportItem(
      type: _reportType,
      title: _titleController.text.trim(),
      category: _selectedCategory,
      description: _descriptionController.text.trim(),
      location: _locationController.text.trim(),
      itemDate: _itemDate,
      imagePath: _reportImage?.path,
      isContactVisible: _isContactVisible,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$_reportType item reported successfully!'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      _titleController.clear();
      _descriptionController.clear();
      _locationController.clear();
      setState(() => _reportImage = null);
      _tabController.animateTo(0);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to submit report. Please try again.'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showClaimDialog(LostFoundModel item) {
    final claimController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Claim "${item.title}"'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Describe identifying marks, color, brand, or unique features to prove ownership:',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: claimController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'e.g., Has a blue sticker on back and lock code starts with 8...',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final notes = claimController.text.trim();
              if (notes.isEmpty) return;
              Navigator.pop(ctx);

              final provider = Provider.of<LostFoundProvider>(context, listen: false);
              final ok = await provider.claimItem(item.id, notes);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok ? 'Claim filed successfully! The finder will be notified.' : 'Failed to file claim.'),
                    backgroundColor: ok ? AppTheme.successColor : AppTheme.errorColor,
                  ),
                );
              }
            },
            child: const Text('Submit Claim'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<LostFoundProvider>(context);

    final filteredItems = provider.items.where((i) {
      if (_filterType == 'All') return true;
      return i.type.toLowerCase() == _filterType.toLowerCase();
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lost & Found Directory'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(text: 'Campus Feed', icon: Icon(Icons.explore_outlined, size: 20)),
            Tab(text: 'Report Item', icon: Icon(Icons.add_box_outlined, size: 20)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Feed
          Column(
            children: [
              // Filter bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                color: Colors.white,
                child: Row(
                  children: ['All', 'Lost', 'Found'].map((f) {
                    final isSel = _filterType == f;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(f),
                        selected: isSel,
                        selectedColor: AppTheme.primaryColor,
                        labelStyle: TextStyle(
                          color: isSel ? Colors.white : AppTheme.textPrimary,
                          fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                          fontSize: 13,
                        ),
                        onSelected: (sel) {
                          if (sel) setState(() => _filterType = f);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
              const Divider(height: 1),

              // Items
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => provider.fetchItems(),
                  child: provider.isLoading && provider.items.isEmpty
                      ? const Center(child: CircularProgressIndicator())
                      : filteredItems.isEmpty
                          ? _buildEmptyFeed()
                          : ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: filteredItems.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final item = filteredItems[index];
                                return _buildLostFoundCard(item);
                              },
                            ),
                ),
              ),
            ],
          ),

          // Tab 2: Report Form
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Report Type *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          avatar: const Icon(Icons.search, size: 16),
                          label: const Center(child: Text('I Lost Something')),
                          selected: _reportType == 'Lost',
                          selectedColor: Colors.red.shade700,
                          labelStyle: TextStyle(
                            color: _reportType == 'Lost' ? Colors.white : AppTheme.textPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                          onSelected: (sel) {
                            if (sel) setState(() => _reportType = 'Lost');
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ChoiceChip(
                          avatar: const Icon(Icons.volunteer_activism, size: 16),
                          label: const Center(child: Text('I Found Something')),
                          selected: _reportType == 'Found',
                          selectedColor: AppTheme.successColor,
                          labelStyle: TextStyle(
                            color: _reportType == 'Found' ? Colors.white : AppTheme.textPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                          onSelected: (sel) {
                            if (sel) setState(() => _reportType = 'Found');
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Category
                  const Text('Item Category *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedCategory,
                    items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedCategory = val);
                    },
                  ),
                  const SizedBox(height: 16),

                  // Item Name
                  const Text('Item Title / Name *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      hintText: 'e.g., Black Dell Laptop Charger in Library 2nd Floor',
                      prefixIcon: Icon(Icons.title),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().length < 4) {
                        return 'Please provide a clear item name';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Location
                  const Text('Where was it lost / found? *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _locationController,
                    decoration: const InputDecoration(
                      hintText: 'e.g., Central Library, Engineering Block LH-204, Canteen',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().length < 3) {
                        return 'Please enter location';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Description
                  const Text('Description & Identifying Marks *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Color, brand, contents, scratches, or special characteristics...',
                    ),
                    validator: (val) {
                      if (val == null || val.trim().length < 8) {
                        return 'Please add more details (at least 8 chars)';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Image Upload
                  const Text('Photograph (Recommended)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  if (_reportImage != null)
                    Stack(
                      children: [
                        Container(
                          height: 140,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            image: DecorationImage(image: FileImage(_reportImage!), fit: BoxFit.cover),
                          ),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: CircleAvatar(
                            backgroundColor: Colors.black54,
                            child: IconButton(
                              icon: const Icon(Icons.close, color: Colors.white, size: 18),
                              onPressed: () => setState(() => _reportImage = null),
                            ),
                          ),
                        ),
                      ],
                    )
                  else
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _pickImage(ImageSource.camera),
                            icon: const Icon(Icons.camera_alt),
                            label: const Text('Camera'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _pickImage(ImageSource.gallery),
                            icon: const Icon(Icons.photo_library),
                            label: const Text('Gallery'),
                          ),
                        ),
                      ],
                    ),
                  const SizedBox(height: 16),

                  // Privacy Switch
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Share My Contact with Claimants', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: const Text('When enabled, students can directly contact you to arrange return.', style: TextStyle(fontSize: 12)),
                    value: _isContactVisible,
                    activeColor: AppTheme.primaryColor,
                    onChanged: (val) => setState(() => _isContactVisible = val),
                  ),
                  const SizedBox(height: 24),

                  // Submit
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleSubmitReport,
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                          )
                        : Text('Submit $_reportType Report'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyFeed() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 64, color: AppTheme.textSecondary),
          SizedBox(height: 12),
          Text('No lost or found items found.', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          SizedBox(height: 4),
          Text('Lost or found something? Report it in the second tab.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildLostFoundCard(LostFoundModel item) {
    final isLost = item.type.toLowerCase() == 'lost';
    final typeColor = isLost ? Colors.red.shade700 : AppTheme.successColor;
    final fullUrl = ApiConstants.fullImageUrl(item.imageUrl);

    return Card(
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
                    color: typeColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    item.type.toUpperCase(),
                    style: TextStyle(
                      color: typeColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    item.category,
                    style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: item.status == 'Claimed' ? Colors.blue.withOpacity(0.1) : const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    item.status,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: item.status == 'Claimed' ? Colors.blue : const Color(0xFF475569),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (fullUrl != null) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      fullUrl,
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 70,
                        height: 70,
                        color: Colors.grey.shade200,
                        child: const Icon(Icons.broken_image, size: 24, color: Colors.grey),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    item.location,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  DateFormat('dd MMM').format(item.itemDate),
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ],
            ),
            const Divider(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  item.isContactVisible && item.reporterPhone != null && item.reporterPhone!.isNotEmpty
                      ? 'Contact: ${item.reporterPhone}'
                      : 'Reported by ${item.reporterName ?? 'Student'}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                if (item.status == 'Open')
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      minimumSize: const Size(60, 32),
                    ),
                    onPressed: () => _showClaimDialog(item),
                    child: Text(isLost ? 'I Found This' : 'Claim Item', style: const TextStyle(fontSize: 12)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
