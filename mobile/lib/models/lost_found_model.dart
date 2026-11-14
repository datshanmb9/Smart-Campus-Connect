class LostFoundModel {
  final String id;
  final String type; // 'Lost' or 'Found'
  final String title;
  final String category;
  final String description;
  final String location;
  final DateTime itemDate;
  final String? imageUrl;
  final String status;
  final String? postedByName;
  final String? postedByPhone;
  final bool isContactVisible;

  String? get reporterName => postedByName;
  String? get reporterPhone => postedByPhone;

  LostFoundModel({
    required this.id,
    required this.type,
    required this.title,
    required this.category,
    required this.description,
    required this.location,
    required this.itemDate,
    this.imageUrl,
    required this.status,
    this.postedByName,
    this.postedByPhone,
    this.isContactVisible = false,
  });

  factory LostFoundModel.fromJson(Map<String, dynamic> json) {
    String? posterName;
    String? posterPhone;
    if (json['postedBy'] != null && json['postedBy'] is Map) {
      posterName = json['postedBy']['fullName'];
      posterPhone = json['postedBy']['phone'];
    }

    return LostFoundModel(
      id: json['_id'] ?? '',
      type: json['type'] ?? 'Lost',
      title: json['title'] ?? '',
      category: json['category'] ?? 'Other',
      description: json['description'] ?? '',
      location: json['location'] ?? '',
      itemDate: json['itemDate'] != null
          ? DateTime.parse(json['itemDate'])
          : DateTime.now(),
      imageUrl: json['imageUrl'],
      status: json['status'] ?? 'Active',
      postedByName: posterName,
      postedByPhone: posterPhone,
      isContactVisible: json['isContactVisible'] ?? false,
    );
  }
}

