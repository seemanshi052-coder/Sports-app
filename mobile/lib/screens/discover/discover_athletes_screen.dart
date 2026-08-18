import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';
import '../../models/athlete_profile.dart';
import '../profile/user_public_profile_screen.dart';

class DiscoverAthletesScreen extends StatefulWidget {
  const DiscoverAthletesScreen({Key? key}) : super(key: key);

  @override
  State<DiscoverAthletesScreen> createState() => _DiscoverAthletesScreenState();
}

class _DiscoverAthletesScreenState extends State<DiscoverAthletesScreen> {
  List<AthleteProfileModel> _athletes = [];
  bool _isLoading = true;
  String _selectedSport = 'all';
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  final List<String> _sports = ['all', 'football', 'basketball', 'athletics'];

  @override
  void initState() {
    super.initState();
    _fetchAthletes();
  }

  Future<void> _fetchAthletes() async {
    setState(() => _isLoading = true);
    try {
      final list = await ApiClient.discoverAthletes(
        sport: _selectedSport == 'all' ? null : _selectedSport,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
      );
      setState(() {
        _athletes = list;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Discover Athletes & Talent'),
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _searchCtrl,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  textInputAction: TextInputAction.search,
                  onSubmitted: (val) {
                    setState(() => _searchQuery = val.trim());
                    _fetchAthletes();
                  },
                  decoration: InputDecoration(
                    hintText: 'Search by athlete name, city, or club...',
                    hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    prefixIcon: const Icon(Icons.search, color: AppTheme.primaryGreen, size: 20),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, color: Colors.white60, size: 18),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _searchQuery = '');
                              _fetchAthletes();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: AppTheme.cardBg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 38,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _sports.length,
                    itemBuilder: (ctx, i) {
                      final sp = _sports[i];
                      final isSelected = _selectedSport == sp;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: ChoiceChip(
                          label: Text(sp == 'all' ? 'All Sports' : sp[0].toUpperCase() + sp.substring(1)),
                          selected: isSelected,
                          onSelected: (val) {
                            setState(() => _selectedSport = sp);
                            _fetchAthletes();
                          },
                          selectedColor: AppTheme.primaryGreen,
                          backgroundColor: AppTheme.cardBg,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.black : Colors.white70,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            fontSize: 12,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // Athletes List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                : _athletes.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.person_search_outlined, size: 64, color: Colors.white.withOpacity(0.2)),
                            const SizedBox(height: 16),
                            const Text('No athletes found.', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            const Text('Try adjusting your search filters.', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchAthletes,
                        color: AppTheme.primaryGreen,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _athletes.length,
                          itemBuilder: (ctx, idx) {
                            final ath = _athletes[idx];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppTheme.cardBg,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white.withOpacity(0.06)),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 28,
                                    backgroundColor: AppTheme.primaryGreen.withOpacity(0.2),
                                    backgroundImage: ath.avatarUrl != null ? NetworkImage(ath.avatarUrl!) : null,
                                    child: ath.avatarUrl == null
                                        ? Text(ath.name[0].toUpperCase(), style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold, fontSize: 20))
                                        : null,
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                ath.name,
                                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            if (ath.overallRating != null)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: AppTheme.primaryGreen.withOpacity(0.2),
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                child: Text(
                                                  '${ath.overallRating}',
                                                  style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold, fontSize: 12),
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${ath.sport.toUpperCase()} • ${ath.position}',
                                          style: const TextStyle(color: AppTheme.primaryGreen, fontSize: 12, fontWeight: FontWeight.w600),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${ath.location}${ath.clubAcademy != null ? ' • ${ath.clubAcademy}' : ''}',
                                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  IconButton(
                                    icon: const Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 16),
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => UserPublicProfileScreen(athleteId: ath.id),
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
