import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../models/assessment_model.dart';
import '../dashboard/athlete_home_screen.dart';

class AssessmentStatusScreen extends StatelessWidget {
  final AssessmentModel assessment;

  const AssessmentStatusScreen({Key? key, required this.assessment}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isOfficial = assessment.mode == 'official';
    final modeLabel = isOfficial ? 'Official Assessment Analysis' : 'Preparation Analysis';
    final modeColor = isOfficial ? Colors.blueAccent : AppTheme.primaryGreen;
    final modeIcon = isOfficial ? Icons.verified : Icons.fitness_center;
    
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: Text(modeLabel),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const SizedBox(height: 16),
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: modeColor.withOpacity(0.15),
                shape: BoxShape.circle,
                border: Border.all(color: modeColor, width: 2),
              ),
              child: Icon(modeIcon, color: modeColor, size: 40),
            ),
            const SizedBox(height: 20),
            Text(
              isOfficial ? 'Official Assessment Queued' : 'Practice Session Queued',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Assessment ID: ${assessment.id}',
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: modeColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                isOfficial ? 'MODE: OFFICIAL' : 'MODE: PREPARATION',
                style: TextStyle(
                  color: modeColor,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Honest Pipeline Status Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Processing Pipeline Lifecycle',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  const SizedBox(height: 16),
                  _buildStepRow(1, 'Video Stored in Supabase Bucket', 'Completed', true),
                  _buildStepRow(2, 'PostgreSQL Assessment Record Created', 'Completed', true),
                  _buildStepRow(3, 'Queued for Computer Vision Worker', 'Pending Execution', false, isCurrent: true),
                  _buildStepRow(4, 'Pose Estimation & Kinematic Verification', 'Awaiting Worker', false),
                  _buildStepRow(5, 'Authentic Score & Tier Calculation', 'Awaiting Analysis', false),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Authentic Assessment Protocol Notice
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blueAccent.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blueAccent.withOpacity(0.2)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Icon(Icons.info_outline, color: Colors.blueAccent, size: 20),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Scores and biomechanics are only generated when genuine computer vision pose tracking evaluates the footage. No synthetic mock numbers are presented.',
                      style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Return to Hub
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const AthleteHomeScreen()),
                    (route) => false,
                  );
                },
                child: const Text('Return to Athlete Hub'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepRow(int step, String title, String subtitle, bool isDone, {bool isCurrent = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14.0),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: isDone
                  ? AppTheme.primaryGreen
                  : isCurrent
                      ? Colors.orangeAccent
                      : AppTheme.cardBorder,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: isDone
                ? const Icon(Icons.check, size: 16, color: Colors.white)
                : Text(
                    '$step',
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: isDone || isCurrent ? Colors.white : AppTheme.textMuted,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: isDone ? AppTheme.primaryGreen : isCurrent ? Colors.orangeAccent : AppTheme.textMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
