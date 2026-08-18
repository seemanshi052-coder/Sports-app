import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';
import '../../models/social_models.dart';

class BlockedUsersScreen extends StatefulWidget {
  const BlockedUsersScreen({Key? key}) : super(key: key);

  @override
  State<BlockedUsersScreen> createState() => _BlockedUsersScreenState();
}

class _BlockedUsersScreenState extends State<BlockedUsersScreen> {
  List<BlockModel> _blockedList = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBlockedUsers();
  }

  Future<void> _loadBlockedUsers() async {
    setState(() => _isLoading = true);
    try {
      final list = await ApiClient.getBlockedUsers();
      setState(() {
        _blockedList = list;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _unblockUser(String blockedId, String name) async {
    try {
      await ApiClient.unblockUser(blockedId);
      _loadBlockedUsers();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unblocked $name')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to unblock: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Blocked Accounts'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : _blockedList.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shield_outlined, size: 64, color: Colors.white.withOpacity(0.2)),
                      const SizedBox(height: 16),
                      const Text('No blocked users.', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      const Text('Users you block will appear here.', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadBlockedUsers,
                  color: AppTheme.primaryGreen,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _blockedList.length,
                    itemBuilder: (ctx, i) {
                      final item = _blockedList[i];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.cardBg,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: Colors.redAccent.withOpacity(0.2),
                              backgroundImage: item.blockedAvatar != null ? NetworkImage(item.blockedAvatar!) : null,
                              child: item.blockedAvatar == null
                                  ? const Icon(Icons.person_off, color: Colors.redAccent, size: 20)
                                  : null,
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.blockedName ?? 'User', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                                  if (item.reason != null && item.reason!.isNotEmpty)
                                    Text('Reason: ${item.reason}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                ],
                              ),
                            ),
                            TextButton(
                              onPressed: () => _unblockUser(item.blockedId, item.blockedName ?? 'User'),
                              child: const Text('Unblock', style: TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
