import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';
import '../../models/athlete_profile.dart';
import '../profile/achievements_screen.dart';
import '../settings/blocked_users_screen.dart';

class AthleteProfileScreen extends StatefulWidget {
  final AthleteProfileModel profile;
  const AthleteProfileScreen({Key? key, required this.profile}) : super(key: key);

  @override
  State<AthleteProfileScreen> createState() => _AthleteProfileScreenState();
}

class _AthleteProfileScreenState extends State<AthleteProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _ageController;
  late TextEditingController _heightController;
  late TextEditingController _weightController;
  late TextEditingController _sportController;
  late TextEditingController _secondarySportsController;
  late TextEditingController _positionController;
  late TextEditingController _locationController;
  late TextEditingController _bioController;
  late TextEditingController _clubController;
  late TextEditingController _schoolController;
  late TextEditingController _trainingController;
  late TextEditingController _personalBestsController;
  late String _visibility;
  late String _experienceLevel;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.profile.name);
    _ageController = TextEditingController(text: widget.profile.age.toString());
    _heightController = TextEditingController(text: widget.profile.heightCm.toString());
    _weightController = TextEditingController(text: widget.profile.weightKg.toString());
    _sportController = TextEditingController(text: widget.profile.sport);
    _secondarySportsController = TextEditingController(text: widget.profile.secondarySports ?? '');
    _positionController = TextEditingController(text: widget.profile.position);
    _locationController = TextEditingController(text: widget.profile.location);
    _bioController = TextEditingController(text: widget.profile.bio ?? '');
    _clubController = TextEditingController(text: widget.profile.clubAcademy ?? '');
    _schoolController = TextEditingController(text: widget.profile.schoolCollege ?? '');
    _trainingController = TextEditingController(text: widget.profile.trainingBackground ?? '');
    _personalBestsController = TextEditingController(text: widget.profile.personalBests ?? '');
    _visibility = widget.profile.visibility;
    _experienceLevel = widget.profile.experienceLevel;
  }

  Future<void> _handleSave() async {
    setState(() => _isSaving = true);
    try {
      await ApiClient.updateMyProfile({
        'name': _nameController.text.trim(),
        'age': int.tryParse(_ageController.text) ?? widget.profile.age,
        'height_cm': int.tryParse(_heightController.text) ?? widget.profile.heightCm,
        'weight_kg': int.tryParse(_weightController.text) ?? widget.profile.weightKg,
        'sport': _sportController.text.trim(),
        'secondary_sports': _secondarySportsController.text.trim(),
        'position': _positionController.text.trim(),
        'experience_level': _experienceLevel,
        'location': _locationController.text.trim(),
        'bio': _bioController.text.trim(),
        'club_academy': _clubController.text.trim(),
        'school_college': _schoolController.text.trim(),
        'training_background': _trainingController.text.trim(),
        'personal_bests': _personalBestsController.text.trim(),
        'visibility': _visibility,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully')),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Update failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Edit Profile & Privacy'),
        actions: [
          IconButton(
            icon: const Icon(Icons.check, color: AppTheme.primaryGreen),
            onPressed: _isSaving ? null : _handleSave,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Quick Shortcuts Row
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.emoji_events_outlined, color: Colors.amber),
                    label: const Text('Achievements', style: TextStyle(color: Colors.white)),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Colors.amber.withOpacity(0.4)),
                      backgroundColor: AppTheme.cardBg,
                    ),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => AchievementsScreen(athleteId: widget.profile.id, isOwner: true),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.block, color: Colors.redAccent),
                    label: const Text('Blocked Users', style: TextStyle(color: Colors.white)),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Colors.redAccent.withOpacity(0.4)),
                      backgroundColor: AppTheme.cardBg,
                    ),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const BlockedUsersScreen()),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Privacy Settings Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primaryGreen.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.privacy_tip_outlined, color: AppTheme.primaryGreen, size: 20),
                      SizedBox(width: 8),
                      Text('Profile Visibility', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text('Control who can discover and view your athletic profile in search and leaderboards.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _visibility,
                    dropdownColor: AppTheme.surfaceBg,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: AppTheme.surfaceBg,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'public', child: Text('Public — Visible to all athletes & scouts')),
                      DropdownMenuItem(value: 'coaches_only', child: Text('Coaches Only — Verified coaches & scouts')),
                      DropdownMenuItem(value: 'private', child: Text('Private — Hidden from search & discovery')),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _visibility = val);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            _buildField('Full Name', _nameController),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildField('Age', _ageController, isNumber: true)),
                const SizedBox(width: 12),
                Expanded(child: _buildField('Height (cm)', _heightController, isNumber: true)),
                const SizedBox(width: 12),
                Expanded(child: _buildField('Weight (kg)', _weightController, isNumber: true)),
              ],
            ),
            const SizedBox(height: 16),
            _buildField('Primary Sport', _sportController),
            const SizedBox(height: 16),
            _buildField('Secondary Sports', _secondarySportsController),
            const SizedBox(height: 16),
            _buildField('Position / Role', _positionController),
            const SizedBox(height: 16),
            _buildField('Location (City, Country)', _locationController),
            const SizedBox(height: 16),
            _buildField('Club / Academy', _clubController),
            const SizedBox(height: 16),
            _buildField('School / College', _schoolController),
            const SizedBox(height: 16),
            _buildField('Personal Bests / Highlights', _personalBestsController, maxLines: 2),
            const SizedBox(height: 16),
            _buildField('Training Background & Routine', _trainingController, maxLines: 3),
            const SizedBox(height: 16),
            _buildField('Bio / Statement', _bioController, maxLines: 3),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _handleSave,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSaving
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                    : const Text('Save Profile Changes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, {bool isNumber = false, int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppTheme.cardBg,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
            ),
          ),
        ),
      ],
    );
  }
}
