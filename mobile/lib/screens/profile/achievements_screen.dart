import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';
import '../../models/achievement_model.dart';

class AchievementsScreen extends StatefulWidget {
  final String athleteId;
  final bool isOwner;

  const AchievementsScreen({
    Key? key,
    required this.athleteId,
    this.isOwner = false,
  }) : super(key: key);

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  List<AchievementModel> _achievements = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAchievements();
  }

  Future<void> _loadAchievements() async {
    setState(() => _isLoading = true);
    try {
      final list = await ApiClient.getAchievements(athleteId: widget.athleteId);
      setState(() {
        _achievements = list;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _showAddAchievementDialog() {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final sportCtrl = TextEditingController();
    final compCtrl = TextEditingController();
    final dateCtrl = TextEditingController();
    final orgCtrl = TextEditingController();
    final rankCtrl = TextEditingController();
    String awardType = 'Medal';
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.cardBg,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Add Athletic Achievement', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _buildInput('Title / Honor *', titleCtrl, 'e.g. State Championship MVP'),
                const SizedBox(height: 12),
                _buildInput('Sport *', sportCtrl, 'e.g. Football / Basketball'),
                const SizedBox(height: 12),
                _buildInput('Competition / League', compCtrl, 'e.g. National Youth Cup'),
                const SizedBox(height: 12),
                _buildInput('Rank / Position Awarded', rankCtrl, 'e.g. 1st Place / Gold Medal'),
                const SizedBox(height: 12),
                _buildInput('Issuing Organization', orgCtrl, 'e.g. State Athletic Federation'),
                const SizedBox(height: 12),
                _buildInput('Date / Season', dateCtrl, 'e.g. Spring 2024'),
                const SizedBox(height: 12),
                _buildInput('Description / Summary', descCtrl, 'Key highlights and game stats...', maxLines: 2),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: isSaving ? null : () async {
                      if (titleCtrl.text.trim().isEmpty || sportCtrl.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please fill in Title and Sport')),
                        );
                        return;
                      }
                      setSheetState(() => isSaving = true);
                      try {
                        await ApiClient.createAchievement({
                          'title': titleCtrl.text.trim(),
                          'sport': sportCtrl.text.trim(),
                          'competition': compCtrl.text.trim(),
                          'rank_position': rankCtrl.text.trim(),
                          'organization': orgCtrl.text.trim(),
                          'date': dateCtrl.text.trim(),
                          'description': descCtrl.text.trim(),
                          'award_type': awardType,
                        });
                        Navigator.of(ctx).pop();
                        _loadAchievements();
                      } catch (e) {
                        setSheetState(() => isSaving = false);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Failed to save achievement: $e')),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.black),
                    child: isSaving
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                        : const Text('Add Achievement', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInput(String label, TextEditingController ctrl, String hint, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        TextField(
          controller: ctrl,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
            filled: true,
            fillColor: AppTheme.surfaceBg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }

  Future<void> _deleteAchievement(String id) async {
    try {
      await ApiClient.deleteAchievement(id);
      _loadAchievements();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Achievement deleted')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Achievements & Honors'),
        actions: [
          if (widget.isOwner)
            IconButton(
              icon: const Icon(Icons.add, color: AppTheme.primaryGreen),
              onPressed: _showAddAchievementDialog,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : _achievements.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.emoji_events_outlined, size: 64, color: Colors.white.withOpacity(0.3)),
                      const SizedBox(height: 16),
                      const Text(
                        'No achievements added yet.',
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
                      ),
                      if (widget.isOwner) ...[
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          icon: const Icon(Icons.add, color: Colors.black),
                          label: const Text('Add Your First Achievement', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
                          onPressed: _showAddAchievementDialog,
                        ),
                      ],
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadAchievements,
                  color: AppTheme.primaryGreen,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _achievements.length,
                    itemBuilder: (context, index) {
                      final ach = _achievements[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.cardBg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.amber.withOpacity(0.3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.amber.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(Icons.emoji_events, color: Colors.amber, size: 24),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        ach.title,
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                      Text(
                                        '${ach.sport}${ach.competition != null ? ' • ${ach.competition}' : ''}',
                                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ),
                                if (widget.isOwner)
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                                    onPressed: () => _deleteAchievement(ach.id),
                                  ),
                              ],
                            ),
                            if (ach.rankPosition != null || ach.date != null || ach.organization != null) ...[
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 8,
                                runSpacing: 6,
                                children: [
                                  if (ach.rankPosition != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppTheme.surfaceBg,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text('Rank: ${ach.rankPosition}', style: const TextStyle(color: Colors.amber, fontSize: 12)),
                                    ),
                                  if (ach.organization != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppTheme.surfaceBg,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(ach.organization!, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                                    ),
                                  if (ach.date != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppTheme.surfaceBg,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(ach.date!, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                    ),
                                ],
                              ),
                            ],
                            if (ach.description != null && ach.description!.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Text(
                                ach.description!,
                                style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
