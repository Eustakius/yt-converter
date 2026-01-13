import React from 'react';
import { motion } from 'framer-motion';

const Background = () => {
    return (
        <div className="fixed inset-0 -z-10 bg-bg overflow-hidden">
            {/* Grid/Noise base */}
            <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-20 pointer-events-none"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 pointer-events-none"></div>

            {/* Central Sigil Structure */}
            <div className="absolute inset-0 flex items-center justify-center mb-20 md:mb-0">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ duration: 2 }}
                    className="relative w-[800px] h-[800px]"
                >
                    {/* Outer Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border border-sigil/10 rounded-full border-dashed"
                    />

                    {/* Inner Complex Geometry */}
                    <svg className="absolute inset-0 w-full h-full text-sigil/5" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.1">
                        <motion.path
                            d="M50 0 L100 50 L50 100 L0 50 Z"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 10, repeat: Infinity }}
                        />
                        <circle cx="50" cy="50" r="30" />
                        <motion.rect
                            x="35" y="35" width="30" height="30"
                            animate={{ rotate: -180 }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        />
                        <line x1="0" y1="50" x2="100" y2="50" />
                        <line x1="50" y1="0" x2="50" y2="100" />
                    </svg>

                    {/* Spikes */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-sigil/20 to-transparent"
                        style={{ x: "-50%", y: "-50%" }}
                        animate={{ rotate: [0, 45, 0, -45, 0], scaleX: [1, 1.5, 1] }}
                        transition={{ duration: 20, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 w-[2px] h-[600px] bg-gradient-to-b from-transparent via-sigil/20 to-transparent"
                        style={{ x: "-50%", y: "-50%" }}
                        animate={{ rotate: [0, 45, 0, -45, 0], scaleY: [1, 1.5, 1] }}
                        transition={{ duration: 25, repeat: Infinity }}
                    />
                </motion.div>
            </div>

            {/* Vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-bg/90"></div>
        </div>
    );
};

export default Background;
