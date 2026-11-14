import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../models/location_model.dart';
import '../../providers/complaints_provider.dart';
import '../complaints/report_issue_screen.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _isProcessing = false;
  final TextEditingController _manualCodeController = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    _manualCodeController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? rawValue = barcodes.first.rawValue;
      if (rawValue != null && rawValue.isNotEmpty) {
        _handleScannedCode(rawValue);
      }
    }
  }

  Future<void> _handleScannedCode(String rawCode) async {
    setState(() => _isProcessing = true);

    // Normalize code in case full URL was encoded e.g. "http://.../qr/PU-ENGG-LH204"
    String code = rawCode.trim();
    if (code.contains('/qr/')) {
      code = code.split('/qr/').last;
    }

    try {
      final complaintsProvider =
          Provider.of<ComplaintsProvider>(context, listen: false);
      final location = await complaintsProvider.resolveLocationByQr(code);

      if (!mounted) return;

      if (location != null) {
        _navigateToReportScreen(location);
      } else {
        _showUnrecognizedDialog(code);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error resolving location: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _navigateToReportScreen([LocationModel? location]) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ReportIssueScreen(prefilledLocation: location),
      ),
    );
  }

  void _showUnrecognizedDialog(String code) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppTheme.warningColor),
            SizedBox(width: 8),
            Text('QR Code Not Found'),
          ],
        ),
        content: Text(
          'Scanned code "$code" is not registered in the Smart Campus Connect database.\n\nWould you like to file a complaint using manual location entry?',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _controller.start();
            },
            child: const Text('Scan Again'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _navigateToReportScreen(null);
            },
            child: const Text('Enter Manually'),
          ),
        ],
      ),
    );
  }

  void _showManualEntrySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Enter Location QR Code',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Type the QR code identifier printed on the classroom plate or choose a demo venue:',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _demoCodeChip('PU-ENGG-LH204', 'Lecture Hall 204'),
                _demoCodeChip('PU-ENGG-CL102', 'Computer Lab 102'),
                _demoCodeChip('PU-LIB-AUD01', 'Auditorium 1'),
                _demoCodeChip('PU-ADMIN-SEM', 'Seminar Hall 3'),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _manualCodeController,
              decoration: const InputDecoration(
                labelText: 'QR Code Identifier',
                hintText: 'e.g., PU-ENGG-LH204',
                prefixIcon: Icon(Icons.qr_code),
              ),
              textCapitalization: TextCapitalization.characters,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                final code = _manualCodeController.text.trim();
                if (code.isNotEmpty) {
                  Navigator.pop(ctx);
                  _handleScannedCode(code);
                }
              },
              child: const Text('Verify & Report Issue'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                _navigateToReportScreen(null);
              },
              child: const Text('Skip QR and select location manually'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _demoCodeChip(String code, String label) {
    return ActionChip(
      avatar: const Icon(Icons.qr_code_2, size: 16, color: AppTheme.primaryColor),
      label: Text(
        '$code ($label)',
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      ),
      backgroundColor: AppTheme.primaryColor.withOpacity(0.08),
      side: const BorderSide(color: Color(0xFFD0D7DE)),
      onPressed: () {
        _manualCodeController.text = code;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('Scan Classroom QR'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            tooltip: 'Toggle Flashlight',
            onPressed: () => _controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_android),
            tooltip: 'Switch Camera',
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera scanner viewport
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),

          // Reticle Overlay
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppTheme.primaryLight,
                  width: 3,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: const BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Colors.white, width: 4),
                          left: BorderSide(color: Colors.white, width: 4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: const BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Colors.white, width: 4),
                          right: BorderSide(color: Colors.white, width: 4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    left: 12,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: const BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: Colors.white, width: 4),
                          left: BorderSide(color: Colors.white, width: 4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: const BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: Colors.white, width: 4),
                          right: BorderSide(color: Colors.white, width: 4),
                        ),
                      ),
                    ),
                  ),
                  if (_isProcessing)
                    const Center(
                      child: CircularProgressIndicator(color: Colors.white),
                    ),
                ],
              ),
            ),
          ),

          // Instructions at top
          Positioned(
            top: 24,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.crop_free, color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Align QR code inside the box to report issue',
                    style: TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Action Bar
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: Column(
              children: [
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppTheme.textPrimary,
                    minimumSize: const Size.fromHeight(50),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: _showManualEntrySheet,
                  icon: const Icon(Icons.keyboard, color: AppTheme.primaryColor),
                  label: const Text(
                    'Type QR Code / Select Demo Venue',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 10),
                TextButton(
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () => _navigateToReportScreen(null),
                  child: const Text('Or file complaint without QR code \u2192'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

