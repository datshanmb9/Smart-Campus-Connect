class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final String department;
  final String? registrationNumber;
  final String? employeeId;
  final String? phone;
  final String? avatarUrl;
  final String? academicYear;
  final String? section;
  final String? approvalStatus;

  bool get isStudent => role.toLowerCase() == 'student';
  bool get isAdmin => role.toLowerCase() == 'admin';
  bool get isFaculty => role.toLowerCase() == 'faculty';

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.department,
    this.registrationNumber,
    this.employeeId,
    this.phone,
    this.avatarUrl,
    this.academicYear,
    this.section,
    this.approvalStatus,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'student',
      department: json['department'] ?? '',
      registrationNumber: json['registrationNumber'],
      employeeId: json['employeeId'],
      phone: json['phone'],
      avatarUrl: json['avatarUrl'],
      academicYear: json['academicYear'],
      section: json['section'],
      approvalStatus: json['approvalStatus'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'role': role,
      'department': department,
      'registrationNumber': registrationNumber,
      'employeeId': employeeId,
      'phone': phone,
      'avatarUrl': avatarUrl,
      'academicYear': academicYear,
      'section': section,
      'approvalStatus': approvalStatus,
    };
  }
}

