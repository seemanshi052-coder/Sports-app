class AchievementModel {
  final String id;
  final String athleteId;
  final String title;
  final String? description;
  final String sport;
  final String? competition;
  final String? date;
  final String? organization;
  final String? rankPosition;
  final String awardType;
  final String? mediaUrl;
  final bool verified;
  final DateTime? createdAt;

  AchievementModel({
    required this.id,
    required this.athleteId,
    required this.title,
    this.description,
    required this.sport,
    this.competition,
    this.date,
    this.organization,
    this.rankPosition,
    this.awardType = 'Medal',
    this.mediaUrl,
    this.verified = false,
    this.createdAt,
  });

  factory AchievementModel.fromJson(Map<String, dynamic> json) {
    return AchievementModel(
      id: json['id'] ?? '',
      athleteId: json['athlete_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      sport: json['sport'] ?? 'All Sports',
      competition: json['competition'],
      date: json['date'],
      organization: json['organization'],
      rankPosition: json['rank_position'],
      awardType: json['award_type'] ?? 'Medal',
      mediaUrl: json['media_url'],
      verified: json['verified'] ?? false,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'sport': sport,
      'competition': competition,
      'date': date,
      'organization': organization,
      'rank_position': rankPosition,
      'award_type': awardType,
      'media_url': mediaUrl,
    };
  }
}
