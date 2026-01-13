import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Search, AlertCircle, Loader2, Film, Music, Crosshair, Zap, Activity } from 'lucide-react';
import axios from 'axios';

const Downloader = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [videoInfo, setVideoInfo] = useState(null);
    const [error, setError] = useState(null);
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedType, setSelectedType] = useState('video'); // 'video' | 'audio'

    const checkUrl = async () => {
        if (!url) return;
        setLoading(true);
        setError(null);
        setVideoInfo(null);
        try {
            const response = await fetch('/api/info?url=' + encodeURIComponent(url));
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch video info');
            }
            const data = await response.json();
            setVideoInfo(data);
            if (data.formats && data.formats.length > 0) {
                const sorted = data.formats.sort((a, b) => {
                    const getRes_ = (l) => parseInt(l) || 0;
                    return getRes_(b.qualityLabel) - getRes_(a.qualityLabel);
                });
                setSelectedFormat(sorted[0]);
            }
        } catch (err) {
            setError(err.message || 'Transmission Error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!url || !selectedFormat) return;
        setDownloading(true);
        setProgress(0);
        setError(null);

        try {
            const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&quality=${selectedFormat.itag}&type=${selectedType}`;

            const response = await axios({
                url: downloadUrl,
                method: 'GET',
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 99999999)); // Fallback if no total
                    setProgress(percentCompleted > 100 ? 99 : percentCompleted);
                    // Standard progress calculation only works if Content-Length is sent. 
                    // Since yt-dlp streams, we might not get it. 
                    // This UI handles both defined and undefined length visually.
                },
            });

            // Create download link
            const href = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = href;
            // Try to get filename from header or default
            const disposition = response.headers['content-disposition'];
            let filename = 'video.mp4';
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(href);
            setProgress(100);
            setTimeout(() => {
                setDownloading(false);
                setProgress(0);
            }, 2000);

        } catch (err) {
            setError("Download Failed: Connection Lost");
            setDownloading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl px-4 z-10 font-mono">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative border border-sigil/30 bg-black/90 backdrop-blur-md p-8 sm:p-12 shadow-[0_0_50px_rgba(255,255,255,0.02)] overflow-hidden"
            >
                {/* Decorative Corners with Glitch Animation */}
                {[0, 90, 180, 270].map((deg, i) => (
                    <div key={i} className="absolute w-6 h-6 border-t-2 border-l-2 border-sigil opacity-50"
                        style={{
                            top: i < 2 ? 0 : 'auto',
                            bottom: i >= 2 ? 0 : 'auto',
                            left: i % 3 === 0 ? 0 : 'auto',
                            right: i % 3 !== 0 ? 0 : 'auto',
                            transform: `rotate(${deg}deg)`
                        }}
                    />
                ))}

                {/* Background Noise/Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

                <div className="text-center mb-10 relative">
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 text-[10px] text-accent tracking-[1em] uppercase whitespace-nowrap opacity-50"
                    >
                        Secure Connection Established
                    </motion.div>

                    <h1 className="text-5xl md:text-6xl font-black text-sigil uppercase tracking-[0.1em] mb-2 glitch-text relative inline-block drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                        Converter
                        <span className="absolute -top-6 -right-12 text-[10px] text-accent font-normal tracking-widest border border-accent/20 px-2 py-0.5 animate-pulse">SYS.V.2.0</span>
                    </h1>
                </div>

                {/* Input Section */}
                <div className="relative group mb-10 z-20">
                    {/* Animated Border Gradient */}
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-sigil/50 to-transparent opacity-0 group-focus-within:opacity-100 transition duration-700 blur-[2px]"></div>

                    <div className="relative flex items-stretch bg-black border border-sigil/30 h-16 transition-all group-focus-within:border-accent/50 group-focus-within:shadow-[0_0_20px_rgba(255,0,60,0.1)]">
                        <div className="pl-6 flex items-center justify-center text-sigil/50 border-r border-sigil/10 pr-4 group-focus-within:text-accent transition-colors duration-500">
                            <Crosshair size={24} className={`transition-all duration-500 ${loading ? 'animate-spin' : 'group-focus-within:rotate-90'}`} />
                        </div>
                        <input
                            type="text"
                            placeholder="ENTER_TARGET_COORDINATES [URL]..."
                            className="flex-1 bg-transparent border-none text-sigil placeholder-sigil/20 focus:ring-0 focus:outline-none px-6 font-mono text-sm h-full tracking-wider w-full selection:bg-accent selection:text-black"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && checkUrl()}
                            autoComplete="off"
                            spellCheck="false"
                        />
                        <button
                            onClick={checkUrl}
                            disabled={loading || !url}
                            className="px-8 border-l border-sigil/30 hover:bg-sigil hover:text-black text-sigil transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-sigil h-full flex items-center justify-center gap-2 uppercase tracking-wide font-bold group/btn relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : <>Init <Zap size={16} className="group-hover/btn:fill-black" /></>}
                            </span>
                            {/* Button Glitch Effect Overlay */}
                            <div className="absolute inset-0 bg-accent translate-y-full group-hover/btn:translate-y-0 transition-transform duration-200 mix-blend-difference pointer-events-none"></div>
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border border-accent bg-accent/10 text-accent p-4 mb-6 text-xs uppercase tracking-widest flex items-center gap-4"
                        >
                            <AlertCircle size={20} className="animate-pulse" />
                            <span>System Error: {error}</span>
                        </motion.div>
                    )}

                    {videoInfo && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="border-t border-dashed border-sigil/20 pt-8 space-y-6 relative"
                        >
                            <div className="absolute top-0 left-0 bg-sigil text-black text-[10px] px-2 uppercase font-bold transform -translate-y-1/2">Data Acquired</div>

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="relative group shrink-0 w-full md:w-72 overflow-hidden border border-sigil/20">
                                    <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none mix-blend-overlay"></div>
                                    <img
                                        src={videoInfo.thumbnail}
                                        alt="Target Visual"
                                        className="w-full aspect-video object-cover grayscale contrast-125 group-hover:scale-110 transition-transform duration-700 ease-out"
                                    />
                                    {/* Scanline overlay */}
                                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-50"></div>

                                    <div className="absolute top-2 left-2 flex gap-1 z-30">
                                        <span className="bg-black/80 text-sigil text-[10px] px-1 border border-sigil/20">REC</span>
                                        <span className="bg-accent text-black text-[10px] px-1 animate-pulse">LIVE</span>
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black/90 px-2 py-0.5 text-xs text-sigil border border-sigil/30 z-20 font-bold">
                                        {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl text-sigil uppercase tracking-wide truncate mb-1 font-bold">{videoInfo.title}</h3>
                                        <div className="flex flex-wrap gap-4 text-sigil/40 text-xs uppercase mb-6 font-semibold">
                                            <span className="flex items-center gap-1"><Activity size={12} /> {videoInfo.author}</span>
                                            <span>//</span>
                                            <span>ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    {/* Format Grid & Type Selector */}
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="text-[10px] text-sigil/30 uppercase tracking-widest">Select Output Format</div>

                                            {/* Type Selector Dropdown */}
                                            <div className="relative inline-block text-left group/dropdown z-50">
                                                <button className="flex items-center gap-2 bg-black border border-sigil/30 px-3 py-1 text-[10px] uppercase text-sigil hover:border-sigil transition-colors">
                                                    <span>{selectedType === 'video' ? 'VIDEO (MP4)' : 'AUDIO (MP3)'}</span>
                                                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-sigil"></div>
                                                </button>
                                                <div className="absolute right-0 mt-1 w-32 bg-black border border-sigil/30 shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200 transform origin-top-right">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => setSelectedType('video')}
                                                            className={`block w-full text-left px-4 py-2 text-[10px] uppercase hover:bg-sigil hover:text-black transition-colors ${selectedType === 'video' ? 'text-accent' : 'text-sigil'}`}
                                                        >
                                                            Video (MP4)
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedType('audio')}
                                                            className={`block w-full text-left px-4 py-2 text-[10px] uppercase hover:bg-sigil hover:text-black transition-colors ${selectedType === 'audio' ? 'text-accent' : 'text-sigil'}`}
                                                        >
                                                            Audio (MP3)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {videoInfo.formats.slice(0, 8).map((fmt) => (
                                                <button
                                                    key={fmt.itag}
                                                    onClick={() => setSelectedFormat(fmt)}
                                                    className={`relative py-2 px-1 text-[10px] uppercase border transition-all overflow-hidden group ${selectedFormat?.itag === fmt.itag
                                                        ? 'bg-sigil text-black border-sigil font-bold shadow-[0_0_15px_rgba(229,229,229,0.3)]'
                                                        : 'bg-transparent text-sigil/60 border-sigil/20 hover:border-sigil hover:text-sigil'
                                                        }`}
                                                >
                                                    <span className="relative z-10">{fmt.qualityLabel || 'AUDIO'}</span>
                                                    {selectedFormat?.itag === fmt.itag && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PROGRESS BAR SECTION */}
                            {downloading ? (
                                <div className="w-full space-y-2">
                                    <div className="flex justify-between text-xs text-sigil/70 uppercase tracking-widest">
                                        <span className="animate-pulse">Processing Stream...</span>
                                        <span>{progress > 0 ? `${progress}%` : 'Calculating...'}</span>
                                    </div>
                                    <div className="h-4 w-full bg-black border border-sigil/30 relative overflow-hidden">
                                        {/* Glitchy Bar */}
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ type: "spring", stiffness: 50 }}
                                            className="h-full bg-accent relative"
                                        >
                                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                        </motion.div>

                                        {/* Indeterminate Scanner if progress is 0/unknown */}
                                        {progress === 0 && (
                                            <motion.div
                                                animate={{ x: [-200, 800] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-sigil/40 to-transparent blur-sm"
                                            />
                                        )}
                                    </div>
                                    <div className="text-[10px] text-sigil/30 font-mono text-center">DO NOT CLOSE WINDOW // MAINTAINING UPLINK</div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleDownload}
                                    disabled={!selectedFormat}
                                    className="relative w-full overflow-hidden group border border-sigil bg-sigil/5 py-5 text-sigil uppercase tracking-[0.3em] font-bold hover:bg-sigil hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <div className="absolute inset-0 bg-accent/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <div className="flex items-center justify-center gap-4 relative z-10">
                                        <span className="group-hover:hidden"><Download size={20} /></span>
                                        <span className="hidden group-hover:block"><Download size={20} className="animate-bounce" /></span>
                                        <span>Execute Download</span>
                                    </div>
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Downloader;
