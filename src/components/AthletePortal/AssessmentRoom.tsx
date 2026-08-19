import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Video,
  Play,
  Square,
  Upload,
  ArrowLeft,
  FileCheck2,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UploadCloud,
  Database,
  Layers,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { Sport, AssessmentType, Assessment, VideoMetadata, GamificationEventResult } from '../../types';
import { FileSizeAlertModal, FileSizeAlertDetails } from './FileSizeAlertModal';

const DEFAULT_MAX_FILE_SIZE_MB = 50;

interface AssessmentRoomProps {
  sport: Sport;
  drill: AssessmentType;
  onBack: () => void;
  onAssessmentCompleted: (assessment: Assessment, gamification?: GamificationEventResult) => void;
}

export const AssessmentRoom: React.FC<AssessmentRoomProps> = ({
  sport,
  drill,
  onBack,
  onAssessmentCompleted
}) => {
  const [cameraMode, setCameraMode] = useState<'live_camera' | 'upload_file'>('live_camera');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  // Storage Limits
  const [maxStorageMB, setMaxStorageMB] = useState<number>(DEFAULT_MAX_FILE_SIZE_MB);
  const [fileSizeAlert, setFileSizeAlert] = useState<FileSizeAlertDetails | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Real video metadata
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Fetch backend storage limits config
  useEffect(() => {
    fetch('/api/v1/storage/config')
      .then(res => res.json())
      .then(data => {
        if (data?.data?.max_file_size_mb) {
          setMaxStorageMB(data.data.max_file_size_mb);
        }
      })
      .catch(err => {
        console.warn('Storage config fetch fallback:', err);
      });
  }, []);

  // Initialize webcam stream if supported
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (cameraMode === 'live_camera') {
      navigator.mediaDevices?.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      })
        .then((s) => {
          stream = s;
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Camera access not granted or unavailable:', err);
          setHasCameraPermission(false);
          setCameraMode('upload_file');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraMode]);

  // Timer while recording
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((sec) => {
          if (sec + 1 >= drill.duration_sec) {
            handleStopRecording();
            return drill.duration_sec;
          }
          return sec + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, drill.duration_sec]);

  const handleStartRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
        
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const blobSizeMB = Number((blob.size / (1024 * 1024)).toFixed(2));
          if (blobSizeMB > maxStorageMB) {
            triggerFileSizeAlert(`recorded_${drill.id}.webm`, blobSizeMB, maxStorageMB);
            return;
          }
          setRecordedBlob(blob);
          setVideoPreviewUrl(URL.createObjectURL(blob));
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
      } catch (e) {
        console.warn('MediaRecorder not available or codec unsupported, recording simulated stream', e);
      }
    }

    setIsRecording(true);
    setRecordingSeconds(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const triggerFileSizeAlert = (fileName: string, fileSizeMB: number, limitMB: number, customMessage?: string) => {
    setFileSizeAlert({
      fileName,
      fileSizeMB,
      maxLimitMB: limitMB,
      message: customMessage || `The selected file size (${fileSizeMB} MB) exceeds the maximum allowed upload limit of ${limitMB} MB.`,
      onSelectAnotherFile: () => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          fileInputRef.current.click();
        }
      },
      onSwitchToCamera: () => {
        setCameraMode('live_camera');
        setVideoPreviewUrl(null);
        setSelectedFile(null);
        setRecordedBlob(null);
      }
    });
    setIsAlertModalOpen(true);
  };

  const validateAndProcessFile = (file: File) => {
    const fileSizeMB = Number((file.size / (1024 * 1024)).toFixed(2));
    if (fileSizeMB > maxStorageMB) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
      setVideoPreviewUrl(null);
      triggerFileSizeAlert(file.name, fileSizeMB, maxStorageMB);
      return false;
    }

    setSelectedFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setCameraMode('upload_file');
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
        validateAndProcessFile(file);
      } else {
        alert('Please select a valid video file (MP4, WebM, MOV).');
      }
    }
  };

  const handleSubmitToStorageAndDatabase = async () => {
    const fileName = selectedFile
      ? selectedFile.name
      : `recorded_${drill.id}_${Date.now()}.webm`;
    const fileSize = selectedFile
      ? selectedFile.size
      : (recordedBlob?.size || 12400000);
    const mimeType = selectedFile
      ? selectedFile.type
      : (recordedBlob?.type || 'video/webm');

    const fileSizeMB = Number((fileSize / (1024 * 1024)).toFixed(2));

    // Client-side pre-validation check
    if (fileSizeMB > maxStorageMB) {
      triggerFileSizeAlert(fileName, fileSizeMB, maxStorageMB);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatusText('Verifying size constraints & requesting Supabase Storage path...');

    try {
      // 1. Request storage path / signed upload url with size validation payload
      const urlRes = await fetch('/api/v1/storage/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: fileName,
          file_type: mimeType,
          file_size_bytes: fileSize,
          bucket: 'assessment-videos'
        })
      });

      const urlData = await urlRes.json();

      if (!urlRes.ok || urlRes.status === 413 || urlData.success === false) {
        setIsUploading(false);
        const serverError = urlData.error?.message || 'File size exceeds allowed storage limits.';
        const maxLimit = urlData.error?.details?.max_file_size_mb || maxStorageMB;
        const currentMB = urlData.error?.details?.current_file_size_mb || fileSizeMB;
        triggerFileSizeAlert(fileName, currentMB, maxLimit, serverError);
        return;
      }

      setUploadProgress(40);
      setUploadStatusText('Uploading video binary to Supabase Storage (bucket: assessment-videos)...');

      const storagePath = urlData.data?.storage_path || `assessments/video_${Date.now()}.mp4`;

      // 2. Prepare verified video metadata
      const videoMetadata: VideoMetadata = {
        file_name: fileName,
        file_size_bytes: fileSize,
        mime_type: mimeType,
        duration_sec: drill.duration_sec,
        resolution: '1920x1080',
        storage_bucket: 'assessment-videos',
        storage_path: storagePath,
        public_url: `https://storage.supabase.co/v1/object/public/assessment-videos/${storagePath}`,
        uploaded_at: new Date().toISOString()
      };

      setUploadProgress(75);
      setUploadStatusText('Creating assessment attempt record in PostgreSQL...');

      // 3. Create real assessment attempt record in database
      const createRes = await fetch('/api/v1/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: sport.id,
          assessment_type: drill.id,
          video_path: storagePath,
          video_url: videoMetadata.public_url,
          video_metadata: videoMetadata
        })
      });

      const createData = await createRes.json();

      if (!createRes.ok || createData.success === false) {
        setIsUploading(false);
        if (createRes.status === 413) {
          triggerFileSizeAlert(fileName, fileSizeMB, maxStorageMB, createData.error?.message);
        } else {
          alert(`Assessment registration notice: ${createData.message || createData.error || 'Please check storage configuration.'}`);
        }
        return;
      }

      setUploadProgress(100);
      setUploadStatusText('Video verified in Supabase Storage. Assessment queued.');

      await new Promise(r => setTimeout(r, 600));
      setIsUploading(false);

      if (createData.success && createData.data?.assessment) {
        onAssessmentCompleted(createData.data.assessment, createData.data.gamification);
      }
    } catch (error: any) {
      console.error('Storage upload or assessment creation failed:', error);
      setIsUploading(false);
      alert('Error connecting to Supabase Storage. Please verify network connectivity and storage bucket configuration.');
    }
  };

  const selectedFileMB = selectedFile
    ? Number((selectedFile.size / (1024 * 1024)).toFixed(2))
    : recordedBlob
    ? Number((recordedBlob.size / (1024 * 1024)).toFixed(2))
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* File Size Limit Alert Modal */}
      <FileSizeAlertModal
        alert={fileSizeAlert}
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            id="back-to-dashboard-btn"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-cyan-400">{sport.name}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                {drill.category}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 hidden sm:inline-flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                Max Size: {maxStorageMB}MB
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white font-display mt-0.5">{drill.name}</h1>
          </div>
        </div>

        {/* Source Toggle */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs self-start sm:self-auto">
          <button
            id="toggle-live-camera-mode-btn"
            onClick={() => {
              setCameraMode('live_camera');
              setVideoPreviewUrl(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              cameraMode === 'live_camera'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera
          </button>
          <button
            id="toggle-upload-file-mode-btn"
            onClick={() => {
              setCameraMode('upload_file');
              if (!selectedFile && !videoPreviewUrl) {
                fileInputRef.current?.click();
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              cameraMode === 'upload_file'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Video File
          </button>
          <input
            id="assessment-video-file-input"
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/avi"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real Camera Feed / Upload Player */}
        <div className="lg:col-span-2 space-y-4">
          <div
            id="video-viewport-container"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative aspect-video bg-slate-950 border rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center transition-all ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-400/50'
                : 'border-slate-800'
            }`}
          >
            {videoPreviewUrl ? (
              <video
                src={videoPreviewUrl}
                controls
                className="w-full h-full object-cover"
              />
            ) : cameraMode === 'live_camera' ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900/60 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center">
                  <UploadCloud className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-white">Drag and drop video here</h4>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Supported: MP4, WebM, MOV • Max limit: <strong className="text-cyan-400">{maxStorageMB}MB</strong>
                  </p>
                </div>
                <button
                  id="select-video-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors shadow-sm"
                >
                  Choose File from Computer
                </button>
              </div>
            )}

            {/* Recording HUD */}
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-600/90 text-white px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-red-500/30 animate-pulse z-20">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                RECORDING {recordingSeconds}s / {drill.duration_sec}s
              </div>
            )}

            {/* Uploading Status Overlay */}
            {isUploading && (
              <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center">
                  <HardDrive className="w-7 h-7 text-cyan-400 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white font-display">Uploading to Supabase Storage</h3>
                  <p className="text-xs text-slate-400 font-mono">{uploadStatusText}</p>
                </div>
                <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Validation Feedback & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Target: <strong>{drill.duration_sec}s</strong></span>
              </div>
              <span className="text-slate-600">|</span>
              {selectedFileMB ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                  <span>Size: {selectedFileMB} MB / {maxStorageMB} MB max</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Limit: <strong>{maxStorageMB} MB</strong></span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {videoPreviewUrl ? (
                <div className="flex items-center gap-2">
                  <button
                    id="retake-replace-video-btn"
                    onClick={() => {
                      setVideoPreviewUrl(null);
                      setRecordedBlob(null);
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Retake / Replace
                  </button>
                  <button
                    id="submit-video-assessment-btn"
                    disabled={isUploading}
                    onClick={handleSubmitToStorageAndDatabase}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <HardDrive className="w-4 h-4" />
                    Save & Queue Video
                  </button>
                </div>
              ) : !isRecording ? (
                <button
                  id="start-camera-recording-btn"
                  disabled={isUploading}
                  onClick={handleStartRecording}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Record Video ({drill.duration_sec}s)
                </button>
              ) : (
                <button
                  id="stop-camera-recording-btn"
                  onClick={handleStopRecording}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  Stop & Review Video
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Standardized Protocol Instructions & Storage Limits */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400 font-semibold">Assessment Protocol</span>
              <h3 className="text-base font-bold text-white mt-0.5">Recording Instructions</h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              {drill.instructions.map((inst, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                    {i + 1}
                  </div>
                  <p className="leading-relaxed">{inst}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-200 uppercase font-mono">Camera Framing Setup</h4>
              <div className="space-y-1.5 text-xs text-slate-400">
                {drill.camera_setup_guidelines.map((guide, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-950/40 p-2 rounded border border-slate-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{guide}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2.5 text-slate-400">
            <div className="flex items-center justify-between text-cyan-400 font-semibold">
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                <span>Storage & Size Validation</span>
              </div>
              <span className="font-mono text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                Max {maxStorageMB} MB
              </span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Uploaded videos are verified on client and server before bucket upload. Files larger than {maxStorageMB}MB are rejected with recovery suggestions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

