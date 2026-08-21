import 'video_metadata.dart';

class AssessmentModel {
  final String id;
  final String athleteId;
  final String? athleteName;
  final String sport;
  final String assessmentType;
  final String assessmentName;
  final String? videoStoragePath;
  final String? videoUrl;
  final VideoMetadataModel? videoMetadata;
  final String status; // created, uploading, uploaded, pending_analysis, completed, failed
  final double? overallScore;
  final String? tier;
  final DateTime? createdAt;
  final String mode; // preparation, official

  AssessmentModel({
    required this.id,
    required this.athleteId,
    this.athleteName,
    required this.sport,
    required this.assessmentType,
    required this.assessmentName,
    this.videoStoragePath,
    this.videoUrl,
    this.videoMetadata,
    required this.status,
    this.overallScore,
    this.tier,
    this.createdAt,
    required this.mode,
  });

  factory AssessmentModel.fromJson(Map<String, dynamic> json) {
    return AssessmentModel(
      id: json['id'] ?? '',
      athleteId: json['athlete_id'] ?? '',
      athleteName: json['athlete_name'],
      sport: json['sport'] ?? '',
      assessmentType: json['assessment_type'] ?? '',
      assessmentName: json['assessment_name'] ?? '',
      videoStoragePath: json['video_storage_path'],
      videoUrl: json['video_url'],
      videoMetadata: json['video_metadata'] != null
          ? VideoMetadataModel.fromJson(json['video_metadata'])
          : null,
      status: json['status'] ?? 'created',
      overallScore: (json['overall_score'] as num?)?.toDouble(),
      tier: json['tier'],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      mode: json['mode'] ?? 'official',
    );
  }
}
