<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class YouTubeController extends Controller
{
    private $ytDlpPath;

    public function __construct()
    {
        $this->ytDlpPath = base_path('bin/yt-dlp');
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

        $process = Process::run([
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
        $titleResult = Process::run([
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

        $cmd = [
            $this->ytDlpPath,
            '--ffmpeg-location',
            base_path('bin'),
            '-o',
            $outputTemplate, // Output to file
            '--no-warnings',
            '--no-check-certificates',
            // Increase socket timeout for standard download
            '--socket-timeout',
            '60',
        ];

        if ($type === 'audio') {
            $filename = $cleanTitle . '.mp3';
            $cmd[] = '-x';
            $cmd[] = '--audio-format';
            $cmd[] = 'mp3';
            $cmd[] = '-f';
            $cmd[] = 'bestaudio/best';
        } else {
            $filename = $cleanTitle . '.mp4';
            if ($quality) {
                $cmd[] = '-f';
                $cmd[] = "{$quality}+bestaudio/best";
            } else {
                $cmd[] = '-f';
                $cmd[] = "bestvideo+bestaudio/best";
            }
            $cmd[] = '--merge-output-format';
            $cmd[] = 'mp4';
        }

        $cmd[] = $url;

        // Increase execution time limit for large downloads
        set_time_limit(0);

        // Run the process synchronously to wait for file creation
        $process = Process::timeout(3600)->run($cmd);

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
