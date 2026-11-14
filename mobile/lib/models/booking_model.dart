import 'location_model.dart';

class BookingModel {
  final String id;
  final String resourceName;
  final LocationModel? location;
  final String purpose;
  final DateTime bookingDate;
  final String startTime;
  final String endTime;
  final int attendeesEstimate;
  final String status;
  final String? rejectionReason;
  final DateTime createdAt;

  String? get adminRemarks => rejectionReason;

  BookingModel({
    required this.id,
    required this.resourceName,
    this.location,
    required this.purpose,
    required this.bookingDate,
    required this.startTime,
    required this.endTime,
    required this.attendeesEstimate,
    required this.status,
    this.rejectionReason,
    required this.createdAt,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    LocationModel? loc;
    if (json['locationId'] != null && json['locationId'] is Map) {
      loc = LocationModel.fromJson(json['locationId']);
    }

    return BookingModel(
      id: json['_id'] ?? '',
      resourceName: json['resourceName'] ?? '',
      location: loc,
      purpose: json['purpose'] ?? '',
      bookingDate: json['bookingDate'] != null
          ? DateTime.parse(json['bookingDate'])
          : DateTime.now(),
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      attendeesEstimate: json['attendeesEstimate'] ?? 20,
      status: json['status'] ?? 'Pending',
      rejectionReason: json['rejectionReason'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}

