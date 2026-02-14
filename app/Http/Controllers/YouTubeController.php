<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class YouTubeController extends Controller
{
    private $ytDlpPath;

    public function __construct()
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $this->ytDlpPath = base_path('bin/yt-dlp.exe');
        } else {
            $this->ytDlpPath = base_path('bin/yt-dlp');
        }
    }

    private function getCleanEnv()
    {
        $env = getenv();
        // Unset Python environment variables that might interfere with the embedded Python in yt-dlp.exe
        unset($env['PYTHONHOME'], $env['PYTHONPATH']);
        return $env;
    }

    public function info(Request $request)
    {
        $url = $request->query('url');
        if (!$url) {
            return response()->json(['error' => 'URL is required'], 400);
        }

        // Check if file exists
        if (!file_exists($this->ytDlpPath)) {
            return response()->json(['error' => 'yt-dlp binary not found at ' . $this->ytDlpPath], 500);
        }

        $process = Process::env($this->getCleanEnv())->run([
            $this->ytDlpPath,
            '--dump-single-json',
            '--no-warnings',
            '--no-check-certificates',
            $url
        ]);

        if ($process->failed()) {
            return response()->json(['error' => 'Failed to fetch video info', 'details' => $process->errorOutput()], 500);
        }

        $info = json_decode($process->output(), true);

        // Transform
        // Transform and Filter
        $allFormats = collect($info['formats'] ?? []);

        // Filter for distinct video qualities (Video Only or Video+Audio)
        $videoFormats = $allFormats
            ->filter(
                fn($f) =>
                ($f['vcodec'] ?? 'none') !== 'none' && // Must have video
                isset($f['height']) &&                 // Must have resolution
                $f['height'] >= 144                    // Filter out super low quality thumbnails/previews
            )
            ->sortByDesc('height') // Sort highest resolution first
            ->unique('height')      // Keep only one entry per resolution (yt-dlp usually sorts best first)
            ->map(fn($f) => [
                'itag' => $f['format_id'],
                'qualityLabel' => $f['height'] . 'p' . (($f['fps'] ?? 30) > 30 ? '60' : ''), // e.g. 1080p60
                'container' => $f['ext'],
                'resolution' => $f['height'],
                'is_video_only' => ($f['acodec'] ?? 'none') === 'none' // Flag for UI knowledge (backend handles merge)
            ])
            ->values();

        // If no video formats found (rare), fallback to raw
        $formats = $videoFormats->isEmpty() ? $allFormats : $videoFormats;

        return response()->json([
            'title' => $info['title'],
            'thumbnail' => $info['thumbnail'],
            'duration' => $info['duration'],
            'author' => $info['uploader'] ?? 'Unknown',
            'formats' => $formats
        ]);
    }

    public function download(Request $request)
    {
        $url = $request->query('url');
        $quality = $request->query('quality');
        $type = $request->query('type', 'video'); // video or audio

        if (!$url) {
            return response()->json(['error' => 'URL is required'], 400);
        }

        // Get title for filename
        $titleResult = Process::env($this->getCleanEnv())->run([
            $this->ytDlpPath,
            '--get-title',
            '--no-warnings',
            '--no-check-certificates',
            $url
        ]);

        $title = trim($titleResult->output());
        $cleanTitle = preg_replace('/[^\w\s-]/', '', $title);
        // Generate a unique temp filename
        $tempId = uniqid('ytdl_');
        $tempDir = storage_path('app/temp');
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        // Output template for yt-dlp
        $outputTemplate = $tempDir . '/' . $tempId . '.%(ext)s';

        $ffmpegLocation = base_path('bin');
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $ffmpegLocation = base_path('bin/ffmpeg.exe');
        }

        $cmd = [
            $this->ytDlpPath,
            '--ffmpeg-location',
            $ffmpegLocation,
            '-o',
            $outputTemplate, // Output to file
            '--no-warnings',
            '--no-check-certificates',
            // Increase socket timeout for standard download
            '--socket-timeout',
            '60',
        ];

        if ($type === 'audio') {
             // Audio Only
             if ($quality === 'mkv') {
                $filename = $cleanTitle . '.mkv';
                $cmd[] = '-x';
                $cmd[] = '--audio-format';
                $cmd[] = 'vorbis'; // Vorbis is standard for MKV audio, or could use best
                $cmd[] = '--audio-quality';
                $cmd[] = '0'; // Best quality
             } else {
                $filename = $cleanTitle . '.mp3';
                $cmd[] = '-x';
                $cmd[] = '--audio-format';
                $cmd[] = 'mp3';
                $cmd[] = '--audio-quality';
                $cmd[] = '0'; // Best quality
             }
             $cmd[] = '-f';
             $cmd[] = 'bestaudio/best';

        } else {
            // Video + Audio
            $ext = ($quality === 'mkv') ? 'mkv' : 'mp4';
            $filename = $cleanTitle . '.' . $ext;

            // yt-dlp format selection
            // We want best video + best audio, merged.
            // If quality (resolution) is specified, we filter by it.
            if ($quality && $quality !== 'mkv') {
                 // Format: "bestvideo[height<=1080]+bestaudio/best"
                 // Note: input 'quality' from frontend is currently just "1080" etc.
                 // But wait, the previous code was: "{$quality}+bestaudio/best"
                 // This implies $quality was a format ID like '137' or similar from the info endpoint?
                 // Let's re-read the info endpoint.
                 // Ah, in info(), 'qualityLabel' is user facing, 'itag' is format_id.
                 // The frontend likely sends the format_id (itag) as 'quality'.
                 // IF so, "{$quality}+bestaudio/best" means "video_format_id + bestaudio".
                 // This is correct for specific selection.
                 $cmd[] = '-f';
                 $cmd[] = "{$quality}+bestaudio/best";
            } else {
                $cmd[] = '-f';
                $cmd[] = "bestvideo+bestaudio/best";
            }

            $cmd[] = '--merge-output-format';
            $cmd[] = $ext;

            // Fix for "No Audio" issue in MP4:
            // YouTube high-res audio is often Opus, which many MP4 players don't support.
            // We force conversion to AAC for MP4 containers to ensure compatibility.
            if ($ext === 'mp4') {
                $cmd[] = '--postprocessor-args';
                // "Merger" logic might vary, but applying to ffmpeg generally works.
                // We use "Merger" specifically if possible, or generic. 
                // yt-dlp syntax: --postprocessor-args "NAME:ARGS"
                $cmd[] = 'Merger:-c:v copy -c:a aac';
            }
        }

        $cmd[] = $url;

        // Increase execution time limit for large downloads
        set_time_limit(0);

        // Run the process synchronously to wait for file creation
        $process = Process::timeout(3600)->env($this->getCleanEnv())->run($cmd);

        if ($process->failed()) {
            return response()->json(['error' => 'Download failed', 'details' => $process->errorOutput()], 500);
        }

        // Find the created file (extension might vary slightly if yt-dlp decided otherwise, but we forced mp4/mp3)
        // We look for files starting with the tempId
        $files = glob($tempDir . '/' . $tempId . '.*');
        if (empty($files)) {
            return response()->json(['error' => 'File creation failed'], 500);
        }

        $downloadFile = $files[0];

        return response()->download($downloadFile, $filename)->deleteFileAfterSend(true);
    }
}
