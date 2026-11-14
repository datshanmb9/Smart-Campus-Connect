class EventModel {
  final String id;
  final String title;
  final String description;
  final String category;
  final String venue;
  final DateTime eventDate;
  final String startTime;
  final String endTime;
  final DateTime registrationDeadline;
  final int maxParticipants;
  final int currentRegistrationsCount;
  final String? bannerImageUrl;
  final String status;
  final bool isUserRegistered;
  final String? ticketCode;

  int get maxCapacity => maxParticipants;
  int get registeredCount => currentRegistrationsCount;

  EventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.venue,
    required this.eventDate,
    required this.startTime,
    required this.endTime,
    required this.registrationDeadline,
    required this.maxParticipants,
    required this.currentRegistrationsCount,
    this.bannerImageUrl,
    required this.status,
    this.isUserRegistered = false,
    this.ticketCode,
  });

  factory EventModel.fromJson(Map<String, dynamic> json,
      {bool isRegistered = false, String? ticket}) {
    return EventModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'Workshop',
      venue: json['venue'] ?? '',
      eventDate: json['eventDate'] != null
          ? DateTime.parse(json['eventDate'])
          : DateTime.now(),
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      registrationDeadline: json['registrationDeadline'] != null
          ? DateTime.parse(json['registrationDeadline'])
          : DateTime.now(),
      maxParticipants: json['maxParticipants'] ?? 100,
      currentRegistrationsCount: json['currentRegistrationsCount'] ?? 0,
      bannerImageUrl: json['bannerImageUrl'],
      status: json['status'] ?? 'Upcoming',
      isUserRegistered: isRegistered,
      ticketCode: ticket,
    );
  }
}

class EventRegistrationModel {
  final String id;
  final String ticketCode;
  final String status;
  final DateTime registrationDate;
  final EventModel? event;

  DateTime get registeredAt => registrationDate;

  EventRegistrationModel({
    required this.id,
    required this.ticketCode,
    required this.status,
    required this.registrationDate,
    this.event,
  });

  factory EventRegistrationModel.fromJson(Map<String, dynamic> json) {
    EventModel? ev;
    if (json['eventId'] != null && json['eventId'] is Map) {
      ev = EventModel.fromJson(json['eventId'] as Map<String, dynamic>);
    }

    return EventRegistrationModel(
      id: json['_id'] ?? '',
      ticketCode: json['ticketCode'] ?? '',
      status: json['status'] ?? 'Registered',
      registrationDate: json['registrationDate'] != null
          ? DateTime.parse(json['registrationDate'])
          : DateTime.now(),
      event: ev,
    );
  }
}

