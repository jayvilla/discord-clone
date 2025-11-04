"use client";

interface ActiveSpeakerPopupProps {
  activeSpeakers: string[];
}

/**
 * 💬 Floating popup that shows who's currently speaking
 * Automatically appears when one or more users are talking.
 */
export function ActiveSpeakerPopup({
  activeSpeakers,
}: ActiveSpeakerPopupProps) {
  if (!activeSpeakers.length) return null;

  return (
    <div className="fixed bottom-32 right-6 bg-neutral-800/90 backdrop-blur-md border border-neutral-700 px-4 py-3 rounded-lg shadow-xl transition-all animate-fade-in">
      <div className="font-semibold text-xs uppercase tracking-wide text-indigo-400 mb-2">
        Speaking
      </div>
      <div className="flex flex-col space-y-1 text-neutral-100 text-sm">
        {activeSpeakers.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
    </div>
  );
}
