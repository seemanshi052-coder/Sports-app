import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';
import '../../models/athlete_profile.dart';
import '../../models/assessment_model.dart';
import '../assessments/sport_selection_screen.dart';
import '../assessments/assessment_history_screen.dart';
import '../leaderboard/leaderboard_screen.dart';
import '../community/community_feed_screen.dart';
import '../messages/conversations_screen.dart';
import '../discover/discover_athletes_screen.dart';
import '../notifications/notifications_screen.dart';


class AthleteHomeScreen extends StatefulWidget {
  const AthleteHomeScreen({Key? key}) : super(key: key);

  @override
  State<AthleteHomeScreen> createState() => _AthleteHomeScreenState();
}

class _AthleteHomeScreenState extends State<AthleteHomeScreen> {
  int _currentTabIndex = 0;
  AthleteProfileModel? _profile;
  List<AssessmentModel> _assessments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final prof = await ApiClient.getMyProfile();
      final asms = await ApiClient.getAssessments();
      setState(() {
        _profile = prof;
        _assessments = asms;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_currentTabIndex == 1) {
      return const CommunityFeedScreen();
    } else if (_currentTabIndex == 2) {
      return const DiscoverAthletesScreen();
    } else if (_currentTabIndex == 3) {
      return const ConversationsScreen();
    }

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('ELITEZ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () {
              if (_profile != null) {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const DiscoverAthletesScreen(),
                  ),
                ).then((_) => _loadData());
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : RefreshIndicator(
              onRefresh: _loadData,
              color: AppTheme.primaryGreen,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Athlete profile header — inline, no card
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: AppTheme.cardBg,
                          backgroundImage: _profile?.avatarUrl != null
                              ? NetworkImage(_profile!.avatarUrl!)
                              : null,
                          child: _profile?.avatarUrl == null
                              ? const Icon(Icons.person, color: AppTheme.textMuted, size: 28)
                              : null,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _profile?.name ?? 'Athlete',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _profile?.sport.toUpperCase() ?? 'Sport',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  const Icon(Icons.star, color: AppTheme.accentAmber, size: 12),
                                  const SizedBox(width: 4),
                                  Text(
                                    _profile?.overallRating != null
                                        ? '${_profile!.overallRating!.toStringAsFixed(1)} OVR'
                                        : 'Unranked',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppTheme.accentAmber,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Primary action: Record New Drill — outlined button
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const SportSelectionScreen(),
                            ),
                          ).then((_) => _loadData());
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.primaryGreen,
                          side: BorderSide(color: AppTheme.primaryGreen.withOpacity(0.5), width: 1),
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          textStyle: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.videocam, size: 20),
                            SizedBox(width: 6),
                            Text('Record New Drill'),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Quick navigation: Leaderboard & History — compact text links
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const LeaderboardScreen()),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.leaderboard, size: 16, color: AppTheme.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  'Leaderboard',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.primaryGreen,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const AssessmentHistoryScreen()),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.history, size: 16, color: AppTheme.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  'History',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.primaryGreen,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Performance summary row — compact, no cards
                    Row(
                      children: [
                        _PerformanceBox(
                          label: 'Performance',
                          value: '${_profile?.overallRating?.toStringAsFixed(1) ?? '—'}',
                          icon: Icons.trending_up,
                          color: AppTheme.primaryGreen,
                        ),
                        const SizedBox(width: 12),
                        _PerformanceBox(
                          label: 'Assessments',
                          value: '${_assessments.length}',
                          icon: Icons.check_circle_outline,
                          color: AppTheme.textMuted,
                        ),
                        const SizedBox(width: 12),
                        _PerformanceBox(
                          label: 'Progress',
                          value: '+8%',
                          icon: Icons.arrow_upward,
                          color: AppTheme.accentAmber,
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // Recent Drill Recordings — compact list, NOT cards
                    const Padding(
                      padding: EdgeInsets.only(bottom: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Recent Activity',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            'View All',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 4),

                    if (_assessments.isEmpty)
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Icon(
                              Icons.video_collection_outlined,
                              color: AppTheme.textMuted,
                              size: 32,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No assessments yet',
                              style: TextStyle(
                                color: AppTheme.textMuted,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Complete your first drill to start tracking your movement.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                            ),
                            const SizedBox(height: 16),
                            OutlinedButton(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const SportSelectionScreen(),
                                  ),
                                ).then((_) => _loadData());
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.primaryGreen,
                                side: BorderSide(color: AppTheme.primaryGreen.withOpacity(0.5), width: 1),
                                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                              child: const Text('Start Assessment'),
                            ),
                          ],
                        ),
                      )
                    else
                      ..._assessments.take(3).map((asm) => _buildRecentAssessmentRow(asm)).toList(),
                  ],
                ),
              ),
            ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: AppTheme.darkBg,
        selectedItemColor: AppTheme.primaryGreen,
        unselectedItemColor: AppTheme.textMuted,
        currentIndex: _currentTabIndex,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          setState(() => _currentTabIndex = index);
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.dynamic_feed), label: 'Feed'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Discover'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: 'Messages'),
        ],
      ),
    );
  }

  Widget _buildRecentAssessmentRow(AssessmentModel asm) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppTheme.cardBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.video_file_outlined,
              color: AppTheme.textMuted,
              size: 20,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  asm.assessmentName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                Text(
                  'Sport: ${asm.sport.toUpperCase()}',
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withOpacity(0.1),
borderRadius: BorderRadius.circular(10),
               border: Border.all(color: AppTheme.primaryGreen.withOpacity(0.3), width: 0.5),
            ),
            child: Text(
              asm.status.toUpperCase(),
              style: const TextStyle(
                color: AppTheme.primaryGreen,
                fontSize: 9,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PerformanceBox extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _PerformanceBox({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
      decoration: BoxDecoration(
        color: Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3), width: 0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 4),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.textMuted,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}