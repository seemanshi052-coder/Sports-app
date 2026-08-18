class PostModel {
  final String id;
  final String authorId;
  final String authorName;
  final String? authorAvatar;
  final String authorRole;
  final String content;
  final String? mediaUrl;
  final String mediaType;
  final String? sport;
  int likesCount;
  int commentsCount;
  bool isLikedByMe;
  final DateTime? createdAt;

  PostModel({
    required this.id,
    required this.authorId,
    required this.authorName,
    this.authorAvatar,
    this.authorRole = 'athlete',
    required this.content,
    this.mediaUrl,
    this.mediaType = 'none',
    this.sport,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.isLikedByMe = false,
    this.createdAt,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    return PostModel(
      id: json['id'] ?? '',
      authorId: json['author_id'] ?? '',
      authorName: json['author_name'] ?? 'Athlete',
      authorAvatar: json['author_avatar'],
      authorRole: json['author_role'] ?? 'athlete',
      content: json['content'] ?? '',
      mediaUrl: json['media_url'],
      mediaType: json['media_type'] ?? 'none',
      sport: json['sport'],
      likesCount: json['likes_count'] ?? 0,
      commentsCount: json['comments_count'] ?? 0,
      isLikedByMe: json['is_liked_by_me'] ?? false,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}

class CommentModel {
  final String id;
  final String postId;
  final String authorId;
  final String authorName;
  final String? authorAvatar;
  final String content;
  final DateTime? createdAt;

  CommentModel({
    required this.id,
    required this.postId,
    required this.authorId,
    required this.authorName,
    this.authorAvatar,
    required this.content,
    this.createdAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['id'] ?? '',
      postId: json['post_id'] ?? '',
      authorId: json['author_id'] ?? '',
      authorName: json['author_name'] ?? 'Athlete',
      authorAvatar: json['author_avatar'],
      content: json['content'] ?? '',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}
