class AssessmentTypeModel {
  final String id;
  final String sportId;
  final String name;
  final String description;
  final int durationSec;
  final String cameraAngle;
  final List<String> metricsMeasured;
  final List<String> instructions;
  final List<String> requirements;

  AssessmentTypeModel({
    required this.id,
    required this.sportId,
    required this.name,
    required this.description,
    required this.durationSec,
    required this.cameraAngle,
    required this.metricsMeasured,
    required this.instructions,
    required this.requirements,
  });

  factory AssessmentTypeModel.fromJson(Map<String, dynamic> json) {
    return AssessmentTypeModel(
      id: json['id'] ?? '',
      sportId: json['sport_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      durationSec: json['duration_sec'] ?? 15,
      cameraAngle: json['camera_angle'] ?? '',
      metricsMeasured: List<String>.from(json['metrics_measured'] ?? []),
      instructions: List<String>.from(json['instructions'] ?? []),
      requirements: List<String>.from(json['requirements'] ?? []),
    );
  }
}

class SportModel {
  final String id;
  final String name;
  final String icon;
  final String description;
  final String category;
  final int activeAthletesCount;
  final List<AssessmentTypeModel> assessmentTypes;

  SportModel({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
    required this.category,
    required this.activeAthletesCount,
    required this.assessmentTypes,
  });

  factory SportModel.fromJson(Map<String, dynamic> json) {
    var typesJson = json['assessment_types'] as List? ?? [];
    return SportModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      icon: json['icon'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? '',
      activeAthletesCount: json['active_athletes_count'] ?? 0,
      assessmentTypes: typesJson.map((e) => AssessmentTypeModel.fromJson(e)).toList(),
    );
  }
}
