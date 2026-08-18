import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';
import '../../models/athlete_profile.dart';
import '../../models/achievement_model.dart';
import '../../models/assessment_model.dart';
import '../messages/chat_screen.dart';
import '../common/report_dialog.dart';

class UserPublicProfileScreen extends StatefulWidget {
  final String athleteId;
  const UserPublicProfileScreen({Key? key, required this.athleteId}) : super(key: key);

  @override
  State<UserPublicProfileScreen> createState() => _UserPublicProfileScreenState();
}

class _UserPublicProfileScreenState extends State<UserPublicProfileScreen> {
  AthleteProfileModel? _profile;
  List<AchievementModel> _achievements = [];
  List<AssessmentModel> _assessments = [];
  bool _isLoading = true;
  bool _isFollowing = false;
  bool _isActionLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final prof = await ApiClient.getAthleteById(widget.athleteId);
      final achs = await ApiClient.getAchievements(athleteId: widget.athleteId);
      final asms = await ApiClient.getAssessments(athleteId: widget.athleteId);
      
      bool following = false;
      if (prof.userId != null) {
        final status = await ApiClient.checkFollowStatus(prof.userId!);
        following = status['is_following'] ?? false;
      }

      setState(() {
        _profile = prof;
        _achievements = achs;
        _assessments = asms;
        _isFollowing = following;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception:', '').trim();
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleFollow() async {
    if (_profile?.userId == null) return;
    setState(() => _isActionLoading = true);
    try {
      if (_isFollowing) {
        await ApiClient.unfollowUser(_profile!.userId!);
        setState(() => _isFollowing = false);
      } else {
        await ApiClient.followUser(_profile!.userId!);
        setState(() => _isFollowing = true);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Action failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  Future<void> _handleStartMessage() async {
    if (_profile?.userId == null) return;
    try {
      final conv = await ApiClient.startConversation(
        recipientId: _profile!.userId!,
        title: 'Conversation with ${_profile!.name}',
      );
      if (mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ChatScreen(
              conversationId: conv.id,
              recipientName: _profile!.name,
              recipientRole: 'athlete',
              recipientAvatar: _profile!.avatarUrl,
            ),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not start conversation: $e')),
      );
    }
  }

  void _showBlockDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBg,
        title: const Text('Block User', style: TextStyle(color: Colors.white)),
        content: Text(
          'Are you sure you want to block ${_profile?.name}? They will no longer be able to message you or interact with your content.',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () async {
              Navigator.of(ctx).pop();
              if (_profile?.userId != null) {
                try {
                  await ApiClient.blockUser(_profile!.userId!);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${_profile!.name} has been blocked.')),
                  );
                  Navigator.of(context).pop();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed to block: $e')),
                  );
                }
              }
            },
            child: const Text('Block', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showReportDialog() {
    if (_profile?.userId == null) return;
    showDialog(
      context: context,
      builder: (_) => ReportDialog(
        targetType: 'profile',
        targetId: _profile!.id,
        reportedUserId: _profile!.userId,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppTheme.darkBg,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
      );
    }

    if (_errorMessage != null || _profile == null) {
      return Scaffold(
        backgroundColor: AppTheme.darkBg,
        appBar: AppBar(title: const Text('Athlete Profile')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outline, size: 64, color: Colors.amber),
                const SizedBox(height: 16),
                Text(
                  _errorMessage ?? 'This profile is unavailable.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70, fontSize: 16),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.black),
                  child: const Text('Back'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final p = _profile!;

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: Text(p.name),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            color: AppTheme.cardBg,
            onSelected: (val) {
              if (val == 'block') _showBlockDialog();
              if (val == 'report') _showReportDialog();
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(
                value: 'report',
                child: Row(
                  children: [
                    Icon(Icons.flag_outlined, color: Colors.amber, size: 20),
                    SizedBox(width: 8),
                    Text('Report Profile', style: TextStyle(color: Colors.white)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'block',
                child: Row(
                  children: [
                    Icon(Icons.block, color: Colors.redAccent, size: 20),
                    SizedBox(width: 8),
                    Text('Block Athlete', style: TextStyle(color: Colors.redAccent)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.primaryGreen.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 36,
                        backgroundColor: AppTheme.primaryGreen.withOpacity(0.2),
                        backgroundImage: p.avatarUrl != null ? NetworkImage(p.avatarUrl!) : null,
                        child: p.avatarUrl == null
                            ? const Icon(Icons.person, color: AppTheme.primaryGreen, size: 36)
                            : null,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.name,
                              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${p.sport.toUpperCase()} • ${p.position}',
                              style: const TextStyle(color: AppTheme.primaryGreen, fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              p.location,
                              style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Followers & Connection Stats
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStat('Followers', '${p.followersCount}'),
                      _buildStat('Following', '${p.followingCount}'),
                      _buildStat('Assessments', '${p.totalAssessments}'),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: Icon(_isFollowing ? Icons.check : Icons.person_add_outlined, size: 18),
                          label: Text(_isFollowing ? 'Following' : 'Follow'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _isFollowing ? AppTheme.surfaceBg : AppTheme.primaryGreen,
                            foregroundColor: _isFollowing ? Colors.white : Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _isActionLoading ? null : _toggleFollow,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.chat_bubble_outline, size: 18, color: Colors.white),
                          label: const Text('Message', style: TextStyle(color: Colors.white)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.white24),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _handleStartMessage,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Bio Section
            if (p.bio != null && p.bio!.isNotEmpty) ...[
              _buildSectionTitle('About'),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppTheme.cardBg, borderRadius: BorderRadius.circular(16)),
                child: Text(p.bio!, style: const TextStyle(color: Colors.white70, height: 1.4)),
              ),
              const SizedBox(height: 20),
            ],

            // Biometrics & Athletic Details
            _buildSectionTitle('Athletic Profile'),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppTheme.cardBg, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  _buildDetailRow('Age', '${p.age} years'),
                  const Divider(color: Colors.white10),
                  _buildDetailRow('Height', '${p.heightCm} cm'),
                  const Divider(color: Colors.white10),
                  _buildDetailRow('Weight', '${p.weightKg} kg'),
                  const Divider(color: Colors.white10),
                  _buildDetailRow('Experience Level', p.experienceLevel.toUpperCase()),
                  if (p.clubAcademy != null && p.clubAcademy!.isNotEmpty) ...[
                    const Divider(color: Colors.white10),
                    _buildDetailRow('Club / Academy', p.clubAcademy!),
                  ],
                  if (p.schoolCollege != null && p.schoolCollege!.isNotEmpty) ...[
                    const Divider(color: Colors.white10),
                    _buildDetailRow('School / College', p.schoolCollege!),
                  ],
                  if (p.personalBests != null && p.personalBests!.isNotEmpty) ...[
                    const Divider(color: Colors.white10),
                    _buildDetailRow('Personal Bests', p.personalBests!),
                  ],
                  if (p.trainingBackground != null && p.trainingBackground!.isNotEmpty) ...[
                    const Divider(color: Colors.white10),
                    _buildDetailRow('Training Background', p.trainingBackground!),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Achievements Section
            _buildSectionTitle('Achievements (${_achievements.length})'),
            if (_achievements.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: AppTheme.cardBg, borderRadius: BorderRadius.circular(16)),
                child: const Text('No achievements added yet.', style: TextStyle(color: AppTheme.textMuted), textAlign: TextAlign.center),
              )
            else
              Column(
                children: _achievements.map((ach) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.cardBg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.amber.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.emoji_events, color: Colors.amber, size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(ach.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            Text('${ach.sport} • ${ach.rankPosition ?? 'Awarded'}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                )).toList(),
              ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
      child: Text(
        title,
        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 13)),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
