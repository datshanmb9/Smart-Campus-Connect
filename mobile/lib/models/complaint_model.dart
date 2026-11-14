import 'location_model.dart';

class ComplaintHistoryItem {
  final String previousStatus;
  final String newStatus;
  final String actionNotes;
  final DateTime timestamp;
  final String? changedByName;

  ComplaintHistoryItem({
    required this.previousStatus,
    required this.newStatus,
    required this.actionNotes,
    required this.timestamp,
    this.changedByName,
  });

  factory ComplaintHistoryItem.fromJson(Map<String, dynamic> json) {
    return ComplaintHistoryItem(
      previousStatus: json['previousStatus'] ?? '',
      newStatus: json['newStatus'] ?? '',
      actionNotes: json['actionNotes'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      changedByName: json['changedBy'] is Map
          ? json['changedBy']['fullName']
          : null,
    );
  }
}

class ComplaintModel {
  final String id;
  final String ticketNumber;
  final String category;
  final String title;
  final String description;
  final String priority;
  final String status;
  final String? imageUrl;
  final LocationModel? location;
  final String? manualRoomNumber;
  final String? manualBuildingName;
  final String? assignedStaffName;
  final String? assignedStaffPhone;
  final String? resolutionNotes;
  final String? rejectionReason;
  final DateTime createdAt;
  final List<ComplaintHistoryItem> history;

  ComplaintModel({
    required this.id,
    required this.ticketNumber,
    required this.category,
    required this.title,
    required this.description,
    required this.priority,
    required this.status,
    this.imageUrl,
    this.location,
    this.manualRoomNumber,
    this.manualBuildingName,
    this.assignedStaffName,
    this.assignedStaffPhone,
    this.resolutionNotes,
    this.rejectionReason,
    required this.createdAt,
    this.history = const [],
  });

  factory ComplaintModel.fromJson(
      Map<String, dynamic> json, [List<dynamic>? historyJson]) {
    LocationModel? loc;
    if (json['locationId'] != null && json['locationId'] is Map) {
      loc = LocationModel.fromJson(json['locationId']);
    }

    String? staffName;
    String? staffPhone;
    if (json['assignedTo'] != null && json['assignedTo'] is Map) {
      staffName = json['assignedTo']['staffName'];
      staffPhone = json['assignedTo']['staffPhone'];
    }

    String? manualRoom;
    String? manualBld;
    if (json['manualLocation'] != null && json['manualLocation'] is Map) {
      manualRoom = json['manualLocation']['roomNumber'];
      manualBld = json['manualLocation']['buildingName'];
    }

    List<ComplaintHistoryItem> parsedHistory = [];
    if (historyJson != null) {
      parsedHistory = historyJson
          .map((h) => ComplaintHistoryItem.fromJson(h as Map<String, dynamic>))
          .toList();
    }

    return ComplaintModel(
      id: json['_id'] ?? '',
      ticketNumber: json['ticketNumber'] ?? '',
      category: json['category'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      priority: json['priority'] ?? 'Medium',
      status: json['status'] ?? 'Pending',
      imageUrl: json['imageUrl'],
      location: loc,
      manualRoomNumber: manualRoom,
      manualBuildingName: manualBld,
      assignedStaffName: staffName,
      assignedStaffPhone: staffPhone,
      resolutionNotes: json['resolutionNotes'],
      rejectionReason: json['rejectionReason'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      history: parsedHistory,
    );
  }

  String get venueDisplay {
    if (location != null) {
      return '${location!.roomNumber} (${location!.buildingName})';
    }
    if (manualRoomNumber != null && manualRoomNumber!.isNotEmpty) {
      return '$manualRoomNumber ($manualBuildingName)';
    }
    return 'Campus Location';
  }
}

