import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';
import '../../models/sport_model.dart';
import '../../models/video_metadata.dart';
import 'assessment_status_screen.dart';
import 'sport_selection_screen.dart';

class VideoUploadScreen extends StatefulWidget {
  final SportModel sport;
  final AssessmentTypeModel drill;
  final AssessmentMode mode;
  final XFile videoFile;

  const VideoUploadScreen({
    Key? key,
    required this.sport,
    required this.drill,
    required this.mode,
    required this.videoFile,
  }) : super(key: key);

  @override
  State<VideoUploadScreen> createState() => _VideoUploadScreenState();
}

class _VideoUploadScreenState extends State<VideoUploadScreen> {
  bool _isUploading = false;
  double _uploadProgress = 0.0;
  String _uploadStatusText = 'Inspecting video properties...';
  int _fileSizeBytes = 0;

  @override
  void initState() {
    super.initState();
    _checkVideoProperties();
  }

  Future<void> _checkVideoProperties() async {
    final length = await widget.videoFile.length();
    setState(() {
      _fileSizeBytes = length;
      _uploadStatusText = 'Ready for Supabase Storage upload (${(_fileSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB)';
    });
  }

  Future<void> _startUploadAndVerification() async {
    setState(() {
      _isUploading = true;
      _uploadProgress = 0.15;
      _uploadStatusText = 'Requesting secure signed URL from FastAPI...';
    });

    try {
      // 1. Get signed upload URL from backend
      final signedInfo = await ApiClient.requestUploadUrl(widget.videoFile.name);
      final String? signedUrl = signedInfo['signed_upload_url'];
      final String storagePath = signedInfo['storage_path'];
      final String bucket = signedInfo['bucket'];

      setState(() {
        _uploadProgress = 0.40;
        _uploadStatusText = 'Streaming video bytes to Supabase Storage ($bucket)...';
      });

      // 2. Direct upload to Supabase Storage if signedUrl available, or direct bytes
      if (signedUrl != null && signedUrl.isNotEmpty) {
        final videoBytes = await widget.videoFile.readAsBytes();
        final putRes = await http.put(
          Uri.parse(signedUrl),
          headers: {'Content-Type': 'video/mp4'},
          body: videoBytes,
        );
        if (putRes.statusCode < 200 || putRes.statusCode >= 300) {
          throw Exception('Storage upload HTTP error: ${putRes.statusCode}');
        }
      }

      setState(() {
        _uploadProgress = 0.75;
        _uploadStatusText = 'Registering assessment record in PostgreSQL...';
      });

      // 3. Register Assessment in FastAPI
      final metadata = VideoMetadataModel(
        fileName: widget.videoFile.name,
        fileSizeBytes: _fileSizeBytes,
        mimeType: 'video/mp4',
        durationSec: widget.drill.durationSec.toDouble(),
        resolution: '1920x1080',
        storageBucket: bucket,
        storagePath: storagePath,
      );

      final assessment = await ApiClient.createAssessment(
        sport: widget.sport.id,
        assessmentType: widget.drill.id,
        videoStoragePath: storagePath,
        metadata: metadata,
        mode: widget.mode == AssessmentMode.preparation ? 'preparation' : 'official',
      );

      setState(() {
        _uploadProgress = 0.90;
        _uploadStatusText = 'Queueing video for computer vision pipeline...';
      });

      // 4. Queue for Worker
      await ApiClient.queueAssessment(assessment.id);

      setState(() {
        _uploadProgress = 1.0;
        _uploadStatusText = 'Upload and queueing complete!';
      });

      await Future.delayed(const Duration(milliseconds: 600));

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => AssessmentStatusScreen(assessment: assessment),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isUploading = false;
        _uploadStatusText = 'Upload failed: $e';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOfficial = widget.mode == AssessmentMode.official;
    
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(title: Text(isOfficial ? 'Official Assessment Upload' : 'Practice Session Upload')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Video Preview Info Card
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
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.videocam, color: AppTheme.primaryGreen),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.drill.name,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Sport: ${widget.sport.name}',
                              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                            ),
                            const SizedBox(height: 2),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isOfficial ? Colors.blueAccent.withOpacity(0.2) : AppTheme.primaryGreen.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                isOfficial ? 'OFFICIAL ASSESSMENT' : 'PREPARATION MODE',
                                style: TextStyle(
                                  color: isOfficial ? Colors.blueAccent : AppTheme.primaryGreen,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: AppTheme.cardBorder),
                  const SizedBox(height: 12),
                  _buildDetailRow('File Name', widget.videoFile.name),
                  const SizedBox(height: 8),
                  _buildDetailRow('File Size', '${(_fileSizeBytes / (1024 * 1024)).toStringAsFixed(2)} MB'),
                  const SizedBox(height: 8),
                  _buildDetailRow('Target Bucket', 'assessment-videos (Supabase)'),
                  const SizedBox(height: 8),
                  _buildDetailRow('Camera Angle', widget.drill.cameraAngle),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Upload Progress Area
            if (_isUploading) ...[
              LinearProgressIndicator(
                value: _uploadProgress,
                backgroundColor: AppTheme.cardBg,
                color: AppTheme.primaryGreen,
                minHeight: 8,
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: 12),
              Text(
                _uploadStatusText,
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 28),
            ] else ...[
              Text(
                _uploadStatusText,
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.cloud_upload_outlined),
                  label: Text(isOfficial ? 'Confirm & Upload Official Assessment' : 'Confirm & Upload Practice Session'),
                  onPressed: _startUploadAndVerification,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
        Text(
          value,
          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}
