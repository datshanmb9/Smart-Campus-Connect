import 'package:flutter_test/flutter_test.dart';
import 'package:smart_campus_connect/models/announcement_model.dart';
import 'package:smart_campus_connect/models/booking_model.dart';
import 'package:smart_campus_connect/models/complaint_model.dart';
import 'package:smart_campus_connect/models/event_model.dart';
import 'package:smart_campus_connect/models/location_model.dart';
import 'package:smart_campus_connect/models/lost_found_model.dart';
import 'package:smart_campus_connect/models/notification_model.dart';
import 'package:smart_campus_connect/models/user_model.dart';

void main() {
  group('Mobile Models JSON Parsing & Logic Tests', () {
    test('UserModel parse and initials', () {
      final user = UserModel.fromJson({
        '_id': 'usr123',
        'fullName': 'Rahul Sharma',
        'email': 'rahul.sharma@presidencyuniversity.in',
        'role': 'student',
        'registrationNumber': '2024MCA001',
        'department': 'Computer Applications',
        'isActive': true,
      });

      expect(user.id, 'usr123');
      expect(user.fullName, 'Rahul Sharma');
      expect(user.isStudent, isTrue);
      expect(user.isAdmin, isFalse);
    });

    test('LocationModel parse and displayName', () {
      final loc = LocationModel.fromJson({
        '_id': 'loc101',
        'qrCode': 'PU-ENGG-LH204',
        'buildingName': 'Engineering Block 1',
        'block': 'Block A',
        'floor': '2nd Floor',
        'roomNumber': 'LH-204',
        'roomType': 'Lecture Hall',
      });

      expect(loc.id, 'loc101');
      expect(loc.qrCode, 'PU-ENGG-LH204');
      expect(loc.displayName, 'LH-204 – Engineering Block 1 (Block A)');
    });

    test('ComplaintModel parse with QR Location and History', () {
      final c = ComplaintModel.fromJson({
        '_id': 'cmp901',
        'ticketNumber': 'CMP-2026-0005',
        'category': 'Projector & AV',
        'title': 'Projector flickering in LH-204',
        'description': 'HDMI input cable is loose and screen goes blank',
        'priority': 'High',
        'status': 'Assigned',
        'locationId': {
          '_id': 'loc101',
          'qrCode': 'PU-ENGG-LH204',
          'buildingName': 'Engineering Block 1',
          'block': 'Block A',
          'floor': '2nd Floor',
          'roomNumber': 'LH-204',
          'roomType': 'Lecture Hall',
        },
        'assignedTo': {
          'staffName': 'Ramesh Kumar (AV Technician)',
          'staffPhone': '+91 98450 11223',
        },
        'createdAt': '2026-11-13T10:00:00.000Z',
      }, [
        {
          'previousStatus': 'Pending',
          'newStatus': 'Assigned',
          'actionNotes': 'Assigned to AV technician',
          'timestamp': '2026-11-13T10:15:00.000Z',
          'changedBy': {'fullName': 'Admin User'},
        }
      ]);

      expect(c.ticketNumber, 'CMP-2026-0005');
      expect(c.status, 'Assigned');
      expect(c.venueDisplay, 'LH-204 (Engineering Block 1)');
      expect(c.assignedStaffName, 'Ramesh Kumar (AV Technician)');
      expect(c.history.length, 1);
      expect(c.history.first.newStatus, 'Assigned');
    });

    test('EventModel & EventRegistrationModel parsing', () {
      final ev = EventModel.fromJson({
        '_id': 'evt501',
        'title': 'AI & Full-Stack Workshop 2026',
        'description': 'Hands-on session on MERN and Flutter',
        'category': 'Workshop',
        'venue': 'Seminar Hall 3',
        'eventDate': '2026-12-05T09:00:00.000Z',
        'startTime': '09:30 AM',
        'endTime': '04:30 PM',
        'maxParticipants': 120,
        'currentRegistrationsCount': 45,
      });

      expect(ev.title, 'AI & Full-Stack Workshop 2026');
      expect(ev.maxCapacity, 120);
      expect(ev.registeredCount, 45);

      final reg = EventRegistrationModel.fromJson({
        '_id': 'reg001',
        'ticketCode': 'EVT-REG-987654',
        'status': 'Confirmed',
        'registrationDate': '2026-11-13T12:00:00.000Z',
      });

      expect(reg.ticketCode, 'EVT-REG-987654');
      expect(reg.registeredAt, isNotNull);
    });

    test('BookingModel parse and adminRemarks alias', () {
      final b = BookingModel.fromJson({
        '_id': 'bk01',
        'resourceName': 'Seminar Hall',
        'purpose': 'MCA Final Project Review',
        'bookingDate': '2026-11-20T00:00:00.000Z',
        'startTime': '10:00',
        'endTime': '12:00',
        'attendeesEstimate': 35,
        'status': 'Approved',
        'rejectionReason': 'Approved for MCA students',
      });

      expect(b.status, 'Approved');
      expect(b.adminRemarks, 'Approved for MCA students');
    });

    test('LostFoundModel parse and reporter getters', () {
      final lf = LostFoundModel.fromJson({
        '_id': 'lf10',
        'type': 'Lost',
        'title': 'Blue HP Calculator',
        'category': 'Electronics',
        'description': 'Left on bench 4 in LH-204',
        'location': 'LH-204',
        'itemDate': '2026-11-13T09:00:00.000Z',
        'status': 'Open',
        'isContactVisible': true,
        'postedBy': {
          'fullName': 'Rahul Sharma',
          'phone': '+91 9876543210',
        },
      });

      expect(lf.reporterName, 'Rahul Sharma');
      expect(lf.reporterPhone, '+91 9876543210');
      expect(lf.isContactVisible, isTrue);
    });

    test('AnnouncementModel parse and isUrgent getter', () {
      final normal = AnnouncementModel.fromJson({
        '_id': 'ann01',
        'title': 'Library hours extended',
        'content': 'Open till 9 PM',
        'category': 'General',
        'isImportant': false,
      });
      expect(normal.isUrgent, isFalse);

      final urgent = AnnouncementModel.fromJson({
        '_id': 'ann02',
        'title': 'Emergency Server Maintenance',
        'content': 'Power shutdown in Block B',
        'category': 'Emergency',
        'isImportant': true,
      });
      expect(urgent.isUrgent, isTrue);
    });

    test('NotificationModel parse and isRead', () {
      final notif = NotificationModel.fromJson({
        '_id': 'nt01',
        'title': 'Complaint Status Updated',
        'message': 'Your ticket CMP-2026-0005 is now In Progress',
        'type': 'complaint',
        'isRead': false,
        'createdAt': '2026-11-13T11:00:00.000Z',
      });

      expect(notif.isRead, isFalse);
      expect(notif.type, 'complaint');
    });
  });
}

