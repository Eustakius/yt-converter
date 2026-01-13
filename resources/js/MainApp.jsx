import React from 'react';
import Background from './components/Background';
import Downloader from './components/Downloader';

const MainApp = () => {
    return (
        <div className="relative min-h-screen flex items-center justify-center p-4">
            <Background />
            <Downloader />

            <footer className="absolute bottom-4 text-white/20 text-sm font-light">
                © 2026 YT Converter - All Rights Reserved
            </footer>
        </div>
    );
};

export default MainApp;
