class VideoMetadataModel {
  final String fileName;
  final int fileSizeBytes;
  final String mimeType;
  final double durationSec;
  final String resolution;
  final String storageBucket;
  final String storagePath;
  final String? publicUrl;

  VideoMetadataModel({
    required this.fileName,
    required this.fileSizeBytes,
    required this.mimeType,
    required this.durationSec,
    required this.resolution,
    required this.storageBucket,
    required this.storagePath,
    this.publicUrl,
  });

  factory VideoMetadataModel.fromJson(Map<String, dynamic> json) {
    return VideoMetadataModel(
      fileName: json['file_name'] ?? '',
      fileSizeBytes: json['file_size_bytes'] ?? 0,
      mimeType: json['mime_type'] ?? 'video/mp4',
      durationSec: (json['duration_sec'] as num?)?.toDouble() ?? 0.0,
      resolution: json['resolution'] ?? '1920x1080',
      storageBucket: json['storage_bucket'] ?? 'assessment-videos',
      storagePath: json['storage_path'] ?? '',
      publicUrl: json['public_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'file_name': fileName,
      'file_size_bytes': fileSizeBytes,
      'mime_type': mimeType,
      'duration_sec': durationSec,
      'resolution': resolution,
      'storage_bucket': storageBucket,
      'storage_path': storagePath,
      'public_url': publicUrl,
    };
  }
}
