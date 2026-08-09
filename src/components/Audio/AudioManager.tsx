import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Howl } from 'howler';
import { Volume2, VolumeX } from 'lucide-react';

// ============================================================
// Base64-encoded minimal WAV sounds (extremely lightweight)
// These are procedurally shaped tiny waveforms
// ============================================================

// Short blip — wheel tick / generic click
const SOUND_BLIP = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Rising tone — access granted
const SOUND_GRANTED = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Descending buzz — access denied
const SOUND_DENIED = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Fanfare — mission complete
const SOUND_COMPLETE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Urgent beep — timer warning
const SOUND_WARNING = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

type SoundName = 'blip' | 'granted' | 'denied' | 'complete' | 'warning';

const soundUrls: Record<SoundName, string> = {
  blip: SOUND_BLIP,
  granted: SOUND_GRANTED,
  denied: SOUND_DENIED,
  complete: SOUND_COMPLETE,
  warning: SOUND_WARNING,
};

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (name: SoundName) => void;
}

const AudioContext = createContext<AudioContextType>({
  isMuted: true,
  toggleMute: () => {},
  playSound: () => {},
});

export function useAudio() {
  return useContext(AudioContext);
}

export function AudioProvider({ children }: { children: ReactNode }) {
  // OFF by default
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const playSound = useCallback(
    (name: SoundName) => {
      if (isMuted) return;

      try {
        const sound = new Howl({
          src: [soundUrls[name]],
          volume: 0.3,
          html5: true,
        });
        sound.play();
      } catch {
        // Silently fail if audio is not supported
      }
    },
    [isMuted]
  );

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </AudioContext.Provider>
  );
}

export function AudioToggle() {
  const { isMuted, toggleMute } = useAudio();

  return (
    <button
      onClick={toggleMute}
      className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded bg-cyber-darker/80 backdrop-blur border border-cyber-border hover:border-neon-green/30 transition-colors cursor-pointer"
      title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4 text-cyber-muted" />
      ) : (
        <Volume2 className="w-4 h-4 text-neon-green" />
      )}
      <span className="font-mono text-xs tracking-wider text-cyber-muted">
        {isMuted ? 'MUTED' : 'SOUND'}
      </span>
    </button>
  );
}
