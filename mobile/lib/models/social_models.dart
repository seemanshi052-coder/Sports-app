class ConnectionModel {
  final String id;
  final String followerId;
  final String followingId;
  final String status;
  final String? userName;
  final String? userAvatar;
  final String? userRole;
  final String? sport;
  final DateTime? createdAt;

  ConnectionModel({
    required this.id,
    required this.followerId,
    required this.followingId,
    this.status = 'following',
    this.userName,
    this.userAvatar,
    this.userRole,
    this.sport,
    this.createdAt,
  });

  factory ConnectionModel.fromJson(Map<String, dynamic> json) {
    return ConnectionModel(
      id: json['id'] ?? '',
      followerId: json['follower_id'] ?? '',
      followingId: json['following_id'] ?? '',
      status: json['status'] ?? 'following',
      userName: json['user_name'],
      userAvatar: json['user_avatar'],
      userRole: json['user_role'],
      sport: json['sport'],
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}

class BlockModel {
  final String id;
  final String blockerId;
  final String blockedId;
  final String? blockedName;
  final String? blockedAvatar;
  final String? reason;
  final DateTime? createdAt;

  BlockModel({
    required this.id,
    required this.blockerId,
    required this.blockedId,
    this.blockedName,
    this.blockedAvatar,
    this.reason,
    this.createdAt,
  });

  factory BlockModel.fromJson(Map<String, dynamic> json) {
    return BlockModel(
      id: json['id'] ?? '',
      blockerId: json['blocker_id'] ?? '',
      blockedId: json['blocked_id'] ?? '',
      blockedName: json['blocked_name'],
      blockedAvatar: json['blocked_avatar'],
      reason: json['reason'],
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}

class ReportModel {
  final String id;
  final String reporterId;
  final String? reportedUserId;
  final String targetType;
  final String targetId;
  final String reason;
  final String? description;
  final String status;
  final DateTime? createdAt;

  ReportModel({
    required this.id,
    required this.reporterId,
    this.reportedUserId,
    required this.targetType,
    required this.targetId,
    required this.reason,
    this.description,
    this.status = 'pending',
    this.createdAt,
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    return ReportModel(
      id: json['id'] ?? '',
      reporterId: json['reporter_id'] ?? '',
      reportedUserId: json['reported_user_id'],
      targetType: json['target_type'] ?? 'profile',
      targetId: json['target_id'] ?? '',
      reason: json['reason'] ?? '',
      description: json['description'],
      status: json['status'] ?? 'pending',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}

class NotificationModel {
  final String id;
  final String recipientId;
  final String? senderId;
  final String? senderName;
  final String type;
  final String title;
  final String body;
  final String? targetId;
  bool isRead;
  final DateTime? createdAt;

  NotificationModel({
    required this.id,
    required this.recipientId,
    this.senderId,
    this.senderName,
    required this.type,
    required this.title,
    required this.body,
    this.targetId,
    this.isRead = false,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? '',
      recipientId: json['recipient_id'] ?? '',
      senderId: json['sender_id'],
      senderName: json['sender_name'],
      type: json['type'] ?? '',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      targetId: json['target_id'],
      isRead: json['is_read'] ?? false,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}
