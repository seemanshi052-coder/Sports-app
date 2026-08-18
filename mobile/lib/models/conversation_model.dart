class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String senderName;
  final String messageText;
  final String? mediaUrl;
  final DateTime? readAt;
  final DateTime? createdAt;

  MessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderName,
    required this.messageText,
    this.mediaUrl,
    this.readAt,
    this.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] ?? '',
      conversationId: json['conversation_id'] ?? '',
      senderId: json['sender_id'] ?? '',
      senderName: json['sender_name'] ?? 'User',
      messageText: json['message_text'] ?? '',
      mediaUrl: json['media_url'],
      readAt: json['read_at'] != null ? DateTime.tryParse(json['read_at']) : null,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}

class ConversationMemberModel {
  final String userId;
  final String userName;
  final String userRole;
  final String? userAvatar;
  final DateTime? lastReadAt;

  ConversationMemberModel({
    required this.userId,
    required this.userName,
    this.userRole = 'athlete',
    this.userAvatar,
    this.lastReadAt,
  });

  factory ConversationMemberModel.fromJson(Map<String, dynamic> json) {
    return ConversationMemberModel(
      userId: json['user_id'] ?? '',
      userName: json['user_name'] ?? 'User',
      userRole: json['user_role'] ?? 'athlete',
      userAvatar: json['user_avatar'],
      lastReadAt: json['last_read_at'] != null ? DateTime.tryParse(json['last_read_at']) : null,
    );
  }
}

class ConversationModel {
  final String id;
  final String? title;
  final bool isGroup;
  final List<ConversationMemberModel> members;
  final MessageModel? lastMessage;
  final int unreadCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ConversationModel({
    required this.id,
    this.title,
    this.isGroup = false,
    required this.members,
    this.lastMessage,
    this.unreadCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    final membersList = (json['members'] as List<dynamic>?)
            ?.map((m) => ConversationMemberModel.fromJson(m))
            .toList() ??
        [];
    return ConversationModel(
      id: json['id'] ?? '',
      title: json['title'],
      isGroup: json['is_group'] ?? false,
      members: membersList,
      lastMessage: json['last_message'] != null
          ? MessageModel.fromJson(json['last_message'])
          : null,
      unreadCount: json['unread_count'] ?? 0,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at']) : null,
    );
  }
}
