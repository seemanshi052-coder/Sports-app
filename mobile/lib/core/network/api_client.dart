import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/env.dart';
import '../../models/user_model.dart';
import '../../models/athlete_profile.dart';
import '../../models/sport_model.dart';
import '../../models/assessment_model.dart';
import '../../models/video_metadata.dart';
import '../../models/achievement_model.dart';
import '../../models/post_model.dart';
import '../../models/conversation_model.dart';
import '../../models/social_models.dart';

class ApiClient {
  static String? _authToken;
  static const String _tokenPrefKey = 'supabase_auth_token';

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString(_tokenPrefKey);
  }

  static Future<void> setAuthToken(String token) async {
    _authToken = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenPrefKey, token);
  }

  static Future<void> clearAuthToken() async {
    _authToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenPrefKey);
  }

  static bool get isAuthenticated => _authToken != null && _authToken!.isNotEmpty;

  static Map<String, String> get _headers {
    final map = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_authToken != null) {
      map['Authorization'] = 'Bearer $_authToken';
    }
    return map;
  }

  // Auth Endpoints
  static Future<UserModel> asyncLogin(String email, String password) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/auth/login'),
      headers: _headers,
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final token = data['access_token'];
      if (token != null) {
        await setAuthToken(token);
      }
      return UserModel.fromJson(data['user']);
    }
    throw Exception('Login failed: ${response.body}');
  }

  static Future<UserModel> asyncRegister(String email, String password, String name) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/auth/register'),
      headers: _headers,
      body: jsonEncode({'email': email, 'password': password, 'name': name, 'role': 'athlete'}),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      final token = data['access_token'];
      if (token != null) {
        await setAuthToken(token);
      }
      return UserModel.fromJson(data['user']);
    }
    throw Exception('Registration failed: ${response.body}');
  }

  static Future<void> asyncLogout() async {
    await clearAuthToken();
  }

  // Athlete Profile
  static Future<AthleteProfileModel> getMyProfile() async {
    final response = await http.get(
      Uri.parse('${Env.apiBaseUrl}/athletes/me'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return AthleteProfileModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to fetch profile: ${response.body}');
  }

  static Future<AthleteProfileModel> updateMyProfile(Map<String, dynamic> updates) async {
    final response = await http.put(
      Uri.parse('${Env.apiBaseUrl}/athletes/me'),
      headers: _headers,
      body: jsonEncode(updates),
    );
    if (response.statusCode == 200) {
      return AthleteProfileModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to update profile: ${response.body}');
  }

  static Future<AthleteProfileModel> getAthleteById(String athleteId) async {
    final response = await http.get(
      Uri.parse('${Env.apiBaseUrl}/athletes/$athleteId'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return AthleteProfileModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to get athlete profile: ${response.body}');
  }

  static Future<List<AthleteProfileModel>> discoverAthletes({
    String? sport,
    String? position,
    String? location,
    String? experienceLevel,
    String? search,
  }) async {
    final params = <String, String>{};
    if (sport != null && sport != 'all') params['sport'] = sport;
    if (position != null && position != 'all') params['position'] = position;
    if (location != null && location.isNotEmpty) params['location'] = location;
    if (experienceLevel != null && experienceLevel != 'all') params['experience_level'] = experienceLevel;
    if (search != null && search.isNotEmpty) params['search'] = search;

    final uri = Uri.parse('${Env.apiBaseUrl}/athletes/discover').replace(queryParameters: params);
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((e) => AthleteProfileModel.fromJson(e)).toList();
    }
    throw Exception('Failed to discover athletes: ${response.body}');
  }

  // Achievements
  static Future<List<AchievementModel>> getAchievements({String? athleteId}) async {
    final params = <String, String>{};
    if (athleteId != null) params['athlete_id'] = athleteId;
    final uri = Uri.parse('${Env.apiBaseUrl}/achievements').replace(queryParameters: params.isNotEmpty ? params : null);
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((e) => AchievementModel.fromJson(e)).toList();
    }
    throw Exception('Failed to fetch achievements');
  }

  static Future<AchievementModel> createAchievement(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/achievements'),
      headers: _headers,
      body: jsonEncode(data),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return AchievementModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to create achievement: ${response.body}');
  }

  static Future<void> deleteAchievement(String achievementId) async {
    final response = await http.delete(
      Uri.parse('${Env.apiBaseUrl}/achievements/$achievementId'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to delete achievement');
    }
  }

  // Community Posts
  static Future<List<PostModel>> getPosts({String? authorId, String? sport}) async {
    final params = <String, String>{};
    if (authorId != null) params['author_id'] = authorId;
    if (sport != null && sport != 'all') params['sport'] = sport;

    final uri = Uri.parse('${Env.apiBaseUrl}/community/posts').replace(queryParameters: params.isNotEmpty ? params : null);
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((e) => PostModel.fromJson(e)).toList();
    }
    throw Exception('Failed to fetch posts');
  }

  static Future<PostModel> createPost({
    required String content,
    String? mediaUrl,
    String mediaType = 'none',
    String? sport,
  }) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/community/posts'),
      headers: _headers,
      body: jsonEncode({
        'content': content,
        'media_url': mediaUrl,
        'media_type': mediaType,
        'sport': sport,
      }),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return PostModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to create post: ${response.body}');
  }

  static Future<void> deletePost(String postId) async {
    final response = await http.delete(
      Uri.parse('${Env.apiBaseUrl}/community/posts/$postId'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to delete post');
    }
  }

  static Future<Map<String, dynamic>> togglePostReaction(String postId) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/community/posts/$postId/react'),
      headers: _headers,
      body: jsonEncode({'reaction_type': 'like'}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to toggle reaction');
  }

  static Future<List<CommentModel>> getComments(String postId) async {
    final response = await http.get(
      Uri.parse('${Env.apiBaseUrl}/community/posts/$postId/comments'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((e) => CommentModel.fromJson(e)).toList();
    }
    throw Exception('Failed to load comments');
  }

  static Future<CommentModel> addComment(String postId, String content) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/community/posts/$postId/comments'),
      headers: _headers,
      body: jsonEncode({'content': content}),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return CommentModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to add comment');
  }

  // Connections / Follows
  static Future<void> followUser(String targetUserId) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/connections/follow'),
      headers: _headers,
      body: jsonEncode({'following_id': targetUserId}),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to follow user');
    }
  }

  static Future<void> unfollowUser(String targetUserId) async {
    final response = await http.delete(
      Uri.parse('${Env.apiBaseUrl}/connections/unfollow/$targetUserId'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to unfollow user');
    }
  }

  static Future<Map<String, dynamic>> checkFollowStatus(String targetUserId) async {
    final response = await http.get(
      Uri.parse('${Env.apiBaseUrl}/connections/status/$targetUserId'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return {'is_following': false, 'is_follower': false};
  }

  // Messaging & Conversations
  static Future<List<ConversationModel>> getConversations() async {
    final response = await http.get(
      Uri.parse('${Env.apiBaseUrl}/messages/conversations'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((e) => ConversationModel.fromJson(e)).toList();
    }
    throw Exception('Failed to fetch conversations');
  }

  static Future<ConversationModel> startConversation({
    required String recipientId,
    String? initialMessage,
    String? title,
  }) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/messages/conversations'),
      headers: _headers,
      body: jsonEncode({
        'recipient_id': recipientId,
        'initial_message': initialMessage,
        'title': title,
      }),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return ConversationModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to start conversation: ${response.body}');
  }

  static Future<List<MessageModel>> getConversationMessages(String conversationId) async {
    final response = await http.get(
      Uri.parse('${Env.apiBaseUrl}/messages/conversations/$conversationId/messages'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((e) => MessageModel.fromJson(e)).toList();
    }
    throw Exception('Failed to load messages');
  }

  static Future<MessageModel> sendMessage(String conversationId, String messageText) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/messages/conversations/$conversationId/messages'),
      headers: _headers,
      body: jsonEncode({'message_text': messageText}),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return MessageModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to send message: ${response.body}');
  }

  // Blocking
  static Future<void> blockUser(String blockedId, {String? reason}) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/blocks'),
      headers: _headers,
      body: jsonEncode({'blocked_id': blockedId, 'reason': reason}),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to block user');
    }
  }

  static Future<void> unblockUser(String blockedId) async {
    final response = await http.delete(
      Uri.parse('${Env.apiBaseUrl}/blocks/$blockedId'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to unblock user');
    }
  }

  static Future<List<BlockModel>> getBlockedUsers() async {
    final response = await http.get(
      Uri.parse('${Env.apiBaseUrl}/blocks'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((e) => BlockModel.fromJson(e)).toList();
    }
    throw Exception('Failed to load blocked users');
  }

  // Reports
  static Future<void> submitReport({
    required String targetType,
    required String targetId,
    String? reportedUserId,
    required String reason,
    String? description,
  }) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/reports'),
      headers: _headers,
      body: jsonEncode({
        'target_type': targetType,
        'target_id': targetId,
        'reported_user_id': reportedUserId,
        'reason': reason,
        'description': description,
      }),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to submit report');
    }
  }

  // Notifications
  static Future<List<NotificationModel>> getNotifications() async {
    final response = await http.get(
      Uri.parse('${Env.apiBaseUrl}/notifications'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((e) => NotificationModel.fromJson(e)).toList();
    }
    throw Exception('Failed to fetch notifications');
  }

  static Future<void> markNotificationRead(String id) async {
    await http.post(
      Uri.parse('${Env.apiBaseUrl}/notifications/$id/read'),
      headers: _headers,
    );
  }

  // Sports Catalog
  static Future<List<SportModel>> getSports() async {
    final response = await http.get(
      Uri.parse('${Env.apiBaseUrl}/sports'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((e) => SportModel.fromJson(e)).toList();
    }
    throw Exception('Failed to fetch sports catalog');
  }

  // Storage: Signed URL Request
  static Future<Map<String, dynamic>> requestUploadUrl(String fileName) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/storage/upload-url'),
      headers: _headers,
      body: jsonEncode({
        'file_name': fileName,
        'bucket': Env.storageBucket,
      }),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to get signed upload URL');
  }

  // Assessment Creation
  static Future<AssessmentModel> createAssessment({
    required String sport,
    required String assessmentType,
    required String videoStoragePath,
    required VideoMetadataModel metadata,
  }) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/assessments'),
      headers: _headers,
      body: jsonEncode({
        'sport': sport,
        'assessment_type': assessmentType,
        'video_storage_path': videoStoragePath,
        'video_metadata': metadata.toJson(),
      }),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return AssessmentModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to create assessment record');
  }

  // Queue Assessment for Analysis Pipeline
  static Future<void> queueAssessment(String assessmentId) async {
    final response = await http.post(
      Uri.parse('${Env.apiBaseUrl}/assessments/$assessmentId/queue'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to queue assessment');
    }
  }

  // Assessment History
  static Future<List<AssessmentModel>> getAssessments({String? athleteId}) async {
    final uri = Uri.parse('${Env.apiBaseUrl}/assessments').replace(
      queryParameters: athleteId != null ? {'athlete_id': athleteId} : null,
    );
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((e) => AssessmentModel.fromJson(e)).toList();
    }
    throw Exception('Failed to fetch assessments');
  }

  // Leaderboard
  static Future<Map<String, dynamic>> getLeaderboard({String? sport}) async {
    final uri = Uri.parse('${Env.apiBaseUrl}/leaderboard').replace(
      queryParameters: sport != null ? {'sport': sport} : null,
    );
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to fetch leaderboard');
  }
}
