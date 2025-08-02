'use client';

interface AudioPlayerProps {
  src: string;
}

const AudioPlayer = ({ src }: AudioPlayerProps) => {
  if (!src) return null;

  return (
    <div className="w-full">
      <audio controls className="w-full">
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default AudioPlayer;
