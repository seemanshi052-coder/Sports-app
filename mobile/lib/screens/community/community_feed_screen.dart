import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';
import '../../models/post_model.dart';
import '../profile/user_public_profile_screen.dart';
import '../common/report_dialog.dart';

class CommunityFeedScreen extends StatefulWidget {
  const CommunityFeedScreen({Key? key}) : super(key: key);

  @override
  State<CommunityFeedScreen> createState() => _CommunityFeedScreenState();
}

class _CommunityFeedScreenState extends State<CommunityFeedScreen> {
  List<PostModel> _posts = [];
  bool _isLoading = true;
  String _selectedSport = 'all';

  final List<String> _sports = ['all', 'football', 'basketball', 'athletics'];

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    setState(() => _isLoading = true);
    try {
      final list = await ApiClient.getPosts(sport: _selectedSport == 'all' ? null : _selectedSport);
      setState(() {
        _posts = list;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _showCreatePostDialog() {
    final contentCtrl = TextEditingController();
    String sportTag = 'football';
    bool isSubmitting = false;

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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Share Training Update', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: sportTag,
                dropdownColor: AppTheme.surfaceBg,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Sport Category',
                  labelStyle: const TextStyle(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.surfaceBg,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
                items: const [
                  DropdownMenuItem(value: 'football', child: Text('Football (Soccer)')),
                  DropdownMenuItem(value: 'basketball', child: Text('Basketball')),
                  DropdownMenuItem(value: 'athletics', child: Text('Track & Athletics')),
                ],
                onChanged: (v) {
                  if (v != null) setSheetState(() => sportTag = v);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: contentCtrl,
                maxLines: 4,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Share your training session, drill progress, or athletic milestones...',
                  hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
                  filled: true,
                  fillColor: AppTheme.surfaceBg,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: isSubmitting ? null : () async {
                    if (contentCtrl.text.trim().isEmpty) return;
                    setSheetState(() => isSubmitting = true);
                    try {
                      await ApiClient.createPost(
                        content: contentCtrl.text.trim(),
                        sport: sportTag,
                      );
                      Navigator.of(ctx).pop();
                      _loadPosts();
                    } catch (e) {
                      setSheetState(() => isSubmitting = false);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed to publish post: $e')),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.black),
                  child: isSubmitting
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                      : const Text('Publish Post', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCommentsBottomSheet(PostModel post) {
    final commentCtrl = TextEditingController();
    List<CommentModel> comments = [];
    bool isLoadingComments = true;
    bool isAdding = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.cardBg,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setCommentState) {
          if (isLoadingComments) {
            ApiClient.getComments(post.id).then((list) {
              setCommentState(() {
                comments = list;
                isLoadingComments = false;
              });
            }).catchError((_) {
              setCommentState(() => isLoadingComments = false);
            });
          }

          return Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
            ),
            child: SizedBox(
              height: 450,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
                  ),
                  const SizedBox(height: 12),
                  Text('Comments (${post.commentsCount})', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Expanded(
                    child: isLoadingComments
                        ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                        : comments.isEmpty
                            ? const Center(child: Text('No comments yet. Be the first to reply!', style: TextStyle(color: AppTheme.textMuted)))
                            : ListView.builder(
                                itemCount: comments.length,
                                itemBuilder: (c, idx) {
                                  final cmt = comments[idx];
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(color: AppTheme.surfaceBg, borderRadius: BorderRadius.circular(12)),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            CircleAvatar(
                                              radius: 12,
                                              backgroundColor: AppTheme.primaryGreen.withOpacity(0.2),
                                              child: Text(cmt.authorName[0].toUpperCase(), style: const TextStyle(color: AppTheme.primaryGreen, fontSize: 10)),
                                            ),
                                            const SizedBox(width: 8),
                                            Text(cmt.authorName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(cmt.content, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                                      ],
                                    ),
                                  );
                                },
                              ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: commentCtrl,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Add a comment...',
                            hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                            filled: true,
                            fillColor: AppTheme.surfaceBg,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: isAdding
                            ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen))
                            : const Icon(Icons.send, color: AppTheme.primaryGreen),
                        onPressed: isAdding ? null : () async {
                          if (commentCtrl.text.trim().isEmpty) return;
                          setCommentState(() => isAdding = true);
                          try {
                            final newCmt = await ApiClient.addComment(post.id, commentCtrl.text.trim());
                            commentCtrl.clear();
                            setCommentState(() {
                              comments.add(newCmt);
                              post.commentsCount += 1;
                              isAdding = false;
                            });
                            setState(() {});
                          } catch (e) {
                            setCommentState(() => isAdding = false);
                          }
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Community Feed'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadPosts,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.black,
        onPressed: _showCreatePostDialog,
        child: const Icon(Icons.edit),
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _sports.length,
              itemBuilder: (ctx, i) {
                final sp = _sports[i];
                final isSelected = _selectedSport == sp;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: FilterChip(
                    label: Text(sp == 'all' ? 'All Sports' : sp[0].toUpperCase() + sp.substring(1)),
                    selected: isSelected,
                    onSelected: (val) {
                      setState(() => _selectedSport = sp);
                      _loadPosts();
                    },
                    selectedColor: AppTheme.primaryGreen.withOpacity(0.2),
                    checkmarkColor: AppTheme.primaryGreen,
                    backgroundColor: AppTheme.cardBg,
                    labelStyle: TextStyle(
                      color: isSelected ? AppTheme.primaryGreen : Colors.white70,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      fontSize: 12,
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          // Posts Feed List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                : _posts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.feed_outlined, size: 64, color: Colors.white.withOpacity(0.2)),
                            const SizedBox(height: 16),
                            const Text(
                              'No posts yet.',
                              style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Be the first athlete to share your journey!',
                              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadPosts,
                        color: AppTheme.primaryGreen,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: _posts.length,
                          itemBuilder: (ctx, idx) {
                            final p = _posts[idx];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppTheme.cardBg,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white.withOpacity(0.06)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Post Header
                                  Row(
                                    children: [
                                      GestureDetector(
                                        onTap: () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (_) => UserPublicProfileScreen(athleteId: 'ath_${p.authorId.substring(0, p.authorId.length > 8 ? 8 : p.authorId.length)}'),
                                            ),
                                          );
                                        },
                                        child: CircleAvatar(
                                          radius: 20,
                                          backgroundColor: AppTheme.primaryGreen.withOpacity(0.2),
                                          backgroundImage: p.authorAvatar != null ? NetworkImage(p.authorAvatar!) : null,
                                          child: p.authorAvatar == null
                                              ? Text(p.authorName[0].toUpperCase(), style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold))
                                              : null,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(p.authorName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                                            Text(
                                              '${p.authorRole.toUpperCase()}${p.sport != null ? ' • ${p.sport}' : ''}',
                                              style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                            ),
                                          ],
                                        ),
                                      ),
                                      PopupMenuButton<String>(
                                        icon: const Icon(Icons.more_horiz, color: Colors.white54),
                                        color: AppTheme.cardBg,
                                        onSelected: (action) {
                                          if (action == 'report') {
                                            showDialog(
                                              context: context,
                                              builder: (_) => ReportDialog(targetType: 'post', targetId: p.id, reportedUserId: p.authorId),
                                            );
                                          }
                                        },
                                        itemBuilder: (c) => [
                                          const PopupMenuItem(
                                            value: 'report',
                                            child: Row(
                                              children: [
                                                Icon(Icons.flag_outlined, color: Colors.amber, size: 18),
                                                SizedBox(width: 8),
                                                Text('Report Post', style: TextStyle(color: Colors.white)),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),

                                  // Post Content
                                  Text(p.content, style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4)),
                                  const SizedBox(height: 16),

                                  // Post Actions (Like & Comment)
                                  Row(
                                    children: [
                                      InkWell(
                                        onTap: () async {
                                          try {
                                            final res = await ApiClient.togglePostReaction(p.id);
                                            setState(() {
                                              p.isLikedByMe = res['is_liked'];
                                              p.likesCount = res['likes_count'];
                                            });
                                          } catch (_) {}
                                        },
                                        child: Row(
                                          children: [
                                            Icon(
                                              p.isLikedByMe ? Icons.favorite : Icons.favorite_border,
                                              color: p.isLikedByMe ? Colors.redAccent : Colors.white60,
                                              size: 20,
                                            ),
                                            const SizedBox(width: 6),
                                            Text('${p.likesCount}', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 24),
                                      InkWell(
                                        onTap: () => _showCommentsBottomSheet(p),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.chat_bubble_outline, color: Colors.white60, size: 20),
                                            const SizedBox(width: 6),
                                            Text('${p.commentsCount}', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                                          ],
                                        ),
                                      ),
                                    ],
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
