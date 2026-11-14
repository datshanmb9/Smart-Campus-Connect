class LocationModel {
  final String id;
  final String qrCode;
  final String buildingName;
  final String block;
  final String floor;
  final String roomNumber;
  final String roomType;
  final String description;
  final List<String> facilities;

  LocationModel({
    required this.id,
    required this.qrCode,
    required this.buildingName,
    required this.block,
    required this.floor,
    required this.roomNumber,
    required this.roomType,
    this.description = '',
    this.facilities = const [],
  });

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      id: json['_id'] ?? '',
      qrCode: json['qrCode'] ?? '',
      buildingName: json['buildingName'] ?? '',
      block: json['block'] ?? '',
      floor: json['floor'] ?? '',
      roomNumber: json['roomNumber'] ?? '',
      roomType: json['roomType'] ?? 'Classroom',
      description: json['description'] ?? '',
      facilities: (json['facilities'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  String get displayName => '$roomNumber – $buildingName ($block)';
}

