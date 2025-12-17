import React from 'react';

// Common style for absolute positioning behind content
const bgStyle = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
    opacity: 0.15, // Subtle watermark effect
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: '10px'
};

const SvgWrapper = ({ children }) => (
    <div style={bgStyle}>
        {children}
    </div>
);

export const MoviesBg = () => (
    <SvgWrapper>
        <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1">
            {/* Clapperboard */}
            <path d="M4 11V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V11" strokeLinecap="round" />
            <path d="M4 11H20V7L4 11Z" strokeLinejoin="round" /> {/* Bottom of top part */}
            <path d="M4 7L8 3L20 7" strokeLinejoin="round" /> {/* Top handle */}
            <path d="M8 3L11 7" /> {/* Stripe 1 */}
            <path d="M14 5L17 9" /> {/* Stripe 2 (approx) */}

            {/* Popcorn (Simple clouds) */}
            <path d="M18 16C18 16 19 15 20 15C21 15 22 16 22 17" stroke="var(--text-secondary)" opacity="0.6" />
            <circle cx="15" cy="18" r="1.5" fill="var(--text-secondary)" opacity="0.3" stroke="none" />
        </svg>
    </SvgWrapper>
);

export const AnimeBg = () => (
    <SvgWrapper>
        <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1">
            {/* Shuriken / Star shape */}
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="rgba(255,255,255,0.1)" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    </SvgWrapper>
);

export const FoodBg = () => (
    <SvgWrapper>
        <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1">
            <path d="M12 2C8 2 6 5 6 5H18C18 5 16 2 12 2Z" /> {/* Burger Top */}
            <rect x="6" y="6" width="12" height="2" rx="1" /> {/* Cheese */}
            <rect x="6" y="9" width="12" height="2" rx="1" /> {/* Meat */}
            <path d="M6 12H18V13C18 15 16 16 12 16C8 16 6 15 6 13V12Z" /> {/* Bun Bottom */}
            <path d="M18 17L19 22" /> <path d="M6 17L5 22" /> {/* Fries? */}
        </svg>
    </SvgWrapper>
);

export const MusicBg = () => (
    <SvgWrapper>
        <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1">
            <path d="M9 18V5L21 3V16" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </svg>
    </SvgWrapper>
);

export const GamesBg = () => (
    <SvgWrapper>
        <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1">
            <rect x="2" y="6" width="20" height="12" rx="6" />
            <circle cx="6" cy="12" r="2" fill="var(--text-secondary)" opacity="0.3" stroke="none" />
            <path d="M18 10V14" strokeWidth="2" />
            <path d="M20 12H16" strokeWidth="2" />
        </svg>
    </SvgWrapper>
);

export const PlacesBg = () => (
    <SvgWrapper>
        <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1">
            <path d="M3 20H24L18 8L13 16L9 10L3 20Z" strokeLinejoin="round" />
            <circle cx="18" cy="5" r="3" opacity="0.5" fill="var(--text-secondary)" stroke="none" />
        </svg>
    </SvgWrapper>
);

export const BACKGROUNDS = [
    { id: 'movies', name: 'Movies', component: MoviesBg, icon: '🎬' },
    { id: 'anime', name: 'Anime', component: AnimeBg, icon: '🍥' },
    { id: 'games', name: 'Games', component: GamesBg, icon: '🎮' },
    { id: 'food', name: 'Food', component: FoodBg, icon: '🍔' },
    { id: 'music', name: 'Music', component: MusicBg, icon: '🎵' },
    { id: 'places', name: 'Places', component: PlacesBg, icon: '🏔️' }
];

export const getBackgroundComponent = (id) => {
    if (!id || !id.startsWith('preset:')) return null;
    const presetId = id.replace('preset:', '');
    const bg = BACKGROUNDS.find(b => b.id === presetId);
    return bg ? bg.component : null;
};
