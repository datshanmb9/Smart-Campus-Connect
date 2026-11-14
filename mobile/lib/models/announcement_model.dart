class AnnouncementModel {
  final String id;
  final String title;
  final String content;
  final String category;
  final bool isImportant;
  final String targetAudience;
  final String? authorName;
  final String? authorDepartment;
  final DateTime createdAt;

  AnnouncementModel({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.isImportant,
    this.targetAudience = 'All',
    this.authorName,
    this.authorDepartment,
    required this.createdAt,
  });

  bool get isUrgent => isImportant || category.toLowerCase() == 'emergency';

  factory AnnouncementModel.fromJson(Map<String, dynamic> json) {
    String? aName;
    String? aDept;
    if (json['author'] != null && json['author'] is Map) {
      aName = json['author']['fullName'];
      aDept = json['author']['department'];
    }

    return AnnouncementModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      category: json['category'] ?? 'General',
      isImportant: json['isImportant'] ?? false,
      targetAudience: json['targetAudience'] ?? 'All',
      authorName: aName,
      authorDepartment: aDept,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}
