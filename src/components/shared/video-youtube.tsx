interface YouTubeEmbedProps {
  videoId?: string;
  title: string;
}

// Renderiza un video de YouTube manteniendo proporcion responsive.
export function YouTubeEmbed({ videoId, title }: YouTubeEmbedProps) {
  if (!videoId) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-dark-blue shadow-sm">
      <iframe
        className="aspect-video w-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
