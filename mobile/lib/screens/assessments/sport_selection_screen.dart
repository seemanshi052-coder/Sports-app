import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';
import '../../models/sport_model.dart';
import 'drill_detail_screen.dart';

enum AssessmentMode { preparation, official }

class SportSelectionScreen extends StatefulWidget {
  final AssessmentMode? initialMode;
  
  const SportSelectionScreen({
    Key? key, 
    this.initialMode,
  }) : super(key: key);

  @override
  State<SportSelectionScreen> createState() => _SportSelectionScreenState();
}

class _SportSelectionScreenState extends State<SportSelectionScreen> {
  List<SportModel> _sports = [];
  bool _isLoading = true;
  AssessmentMode _selectedMode = AssessmentMode.preparation;

  @override
  void initState() {
    super.initState();
    if (widget.initialMode != null) {
      _selectedMode = widget.initialMode!;
    }
    _loadSports();
  }

  Future<void> _loadSports() async {
    try {
      final list = await ApiClient.getSports();
      setState(() {
        _sports = list;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(title: const Text('Select Assessment Mode')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Mode Selection Cards
                const Text(
                  'How would you like to assess?',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 16),
                _buildModeCard(
                  mode: AssessmentMode.preparation,
                  title: 'Preparation Mode',
                  description: 'Practice regularly, track improvement, and build your performance.',
                  icon: Icons.fitness_center,
                ),
                const SizedBox(height: 12),
                _buildModeCard(
                  mode: AssessmentMode.official,
                  title: 'Official Assessment',
                  description: 'Complete a standardized assessment for your official performance record.',
                  icon: Icons.verified,
                ),
                const SizedBox(height: 32),
                const Divider(color: AppTheme.cardBorder),
                const SizedBox(height: 16),
                Text(
                  'Select Sport (${_selectedMode == AssessmentMode.preparation ? "Practice" : "Standardized"})',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 16),
                // Sport List
                ..._sports.map((sport) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: AppTheme.cardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    child: ExpansionTile(
                      shape: const Border(),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.sports, color: AppTheme.primaryGreen),
                      ),
                      title: Text(
                        sport.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                      subtitle: Text(
                        sport.category,
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                      ),
                      children: sport.assessmentTypes.map((drill) {
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                          title: Text(
                            drill.name,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                          subtitle: Text(
                            'Duration: ${drill.durationSec}s • Angle: ${drill.cameraAngle}',
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                          ),
                          trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.primaryGreen),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => DrillDetailScreen(
                                  sport: sport,
                                  drill: drill,
                                  mode: _selectedMode,
                                ),
                              ),
                            );
                          },
                        );
                      }).toList(),
                    ),
                  );
                }),
                const SizedBox(height: 40),
                // Continue Button
                ElevatedButton(
                  onPressed: _sports.isEmpty || _sports.first.assessmentTypes.isEmpty
                      ? null
                      : () {
                          final firstDrill = _sports.first.assessmentTypes.first;
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => DrillDetailScreen(
                                sport: _sports.first,
                                drill: firstDrill,
                                mode: _selectedMode,
                              ),
                            ),
                          );
                        },
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 50),
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Continue'),
                ),
              ],
            ),
    );
  }

  Widget _buildModeCard({
    required AssessmentMode mode,
    required String title,
    required String description,
    required IconData icon,
  }) {
    final isSelected = _selectedMode == mode;
    return GestureDetector(
      onTap: () => setState(() => _selectedMode = mode),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryGreen.withOpacity(0.15) : AppTheme.cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppTheme.primaryGreen : AppTheme.cardBorder,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primaryGreen : AppTheme.primaryGreen.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: isSelected ? Colors.white : AppTheme.primaryGreen, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppTheme.primaryGreen, size: 24),
          ],
        ),
      ),
    );
  }
}