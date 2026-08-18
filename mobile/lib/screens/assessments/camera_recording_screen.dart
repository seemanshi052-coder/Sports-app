import 'dart:async';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme/app_theme.dart';
import '../../models/sport_model.dart';
import 'video_upload_screen.dart';

class CameraRecordingScreen extends StatefulWidget {
  final SportModel sport;
  final AssessmentTypeModel drill;

  const CameraRecordingScreen({
    Key? key,
    required this.sport,
    required this.drill,
  }) : super(key: key);

  @override
  State<CameraRecordingScreen> createState() => _CameraRecordingScreenState();
}

class _CameraRecordingScreenState extends State<CameraRecordingScreen> {
  final ImagePicker _picker = ImagePicker();
  bool _isSelecting = false;

  Future<void> _recordVideoWithCamera() async {
    setState(() => _isSelecting = true);
    try {
      final XFile? video = await _picker.pickVideo(
        source: ImageSource.camera,
        maxDuration: Duration(seconds: widget.drill.durationSec + 5),
      );

      if (video != null && mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => VideoUploadScreen(
              sport: widget.sport,
              drill: widget.drill,
              videoFile: video,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Camera access note: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSelecting = false);
    }
  }

  Future<void> _pickVideoFromGallery() async {
    setState(() => _isSelecting = true);
    try {
      final XFile? video = await _picker.pickVideo(
        source: ImageSource.gallery,
      );

      if (video != null && mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => VideoUploadScreen(
              sport: widget.sport,
              drill: widget.drill,
              videoFile: video,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gallery pick error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSelecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(widget.drill.name),
      ),
      body: Stack(
        children: [
          // Viewfinder Guidelines
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              height: 380,
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.primaryGreen.withOpacity(0.6), width: 2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Align athlete profile: ${widget.drill.cameraAngle}',
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ),
                  const Icon(Icons.accessibility_new, size: 100, color: Colors.white24),
                  Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Ensure full body is visible throughout the drill',
                        style: const TextStyle(color: AppTheme.primaryGreen, fontSize: 11),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Recording & Selection Controls
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // Pick from library button
                    IconButton(
                      iconSize: 32,
                      icon: const Icon(Icons.photo_library, color: Colors.white),
                      onPressed: _isSelecting ? null : _pickVideoFromGallery,
                    ),

                    // Big Record Button
                    GestureDetector(
                      onTap: _isSelecting ? null : _recordVideoWithCamera,
                      child: Container(
                        width: 76,
                        height: 76,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.redAccent,
                          border: Border.all(color: Colors.white, width: 4),
                        ),
                        child: const Icon(Icons.videocam, color: Colors.white, size: 36),
                      ),
                    ),

                    // Placeholder/Switch Camera
                    IconButton(
                      iconSize: 32,
                      icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
                      onPressed: () {},
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Tap red button to record with camera or select video from library',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white60, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
