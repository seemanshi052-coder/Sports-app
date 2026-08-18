class AthleteProfileModel {
  final String id;
  final String? userId;
  final String name;
  final String? email;
  final int age;
  final String gender;
  final int heightCm;
  final int weightKg;
  final String sport;
  final String? secondarySports;
  final String position;
  final String experienceLevel;
  final String location;
  final String? bio;
  final String? avatarUrl;
  final String? trainingBackground;
  final String? clubAcademy;
  final String? schoolCollege;
  final String? personalBests;
  final String visibility;
  final String verificationStatus;
  final int followersCount;
  final int followingCount;
  final double? overallRating;
  final int totalAssessments;

  AthleteProfileModel({
    required this.id,
    this.userId,
    required this.name,
    this.email,
    required this.age,
    required this.gender,
    required this.heightCm,
    required this.weightKg,
    required this.sport,
    this.secondarySports,
    required this.position,
    required this.experienceLevel,
    required this.location,
    this.bio,
    this.avatarUrl,
    this.trainingBackground,
    this.clubAcademy,
    this.schoolCollege,
    this.personalBests,
    this.visibility = 'public',
    this.verificationStatus = 'unverified',
    this.followersCount = 0,
    this.followingCount = 0,
    this.overallRating,
    required this.totalAssessments,
  });

  factory AthleteProfileModel.fromJson(Map<String, dynamic> json) {
    return AthleteProfileModel(
      id: json['id'] ?? '',
      userId: json['user_id'],
      name: json['name'] ?? 'Athlete',
      email: json['email'],
      age: json['age'] ?? 18,
      gender: json['gender'] ?? 'other',
      heightCm: json['height_cm'] ?? 175,
      weightKg: json['weight_kg'] ?? 70,
      sport: json['sport'] ?? 'football',
      secondarySports: json['secondary_sports'],
      position: json['position'] ?? 'Forward',
      experienceLevel: json['experience_level'] ?? 'intermediate',
      location: json['location'] ?? 'United States',
      bio: json['bio'],
      avatarUrl: json['avatar_url'],
      trainingBackground: json['training_background'],
      clubAcademy: json['club_academy'],
      schoolCollege: json['school_college'],
      personalBests: json['personal_bests'],
      visibility: json['visibility'] ?? 'public',
      verificationStatus: json['verification_status'] ?? 'unverified',
      followersCount: json['followers_count'] ?? 0,
      followingCount: json['following_count'] ?? 0,
      overallRating: (json['overall_rating'] as num?)?.toDouble(),
      totalAssessments: json['total_assessments'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'age': age,
      'gender': gender,
      'height_cm': heightCm,
      'weight_kg': weightKg,
      'sport': sport,
      'secondary_sports': secondarySports,
      'position': position,
      'experience_level': experienceLevel,
      'location': location,
      'bio': bio,
      'avatar_url': avatarUrl,
      'training_background': trainingBackground,
      'club_academy': clubAcademy,
      'school_college': schoolCollege,
      'personal_bests': personalBests,
      'visibility': visibility,
    };
  }
}
