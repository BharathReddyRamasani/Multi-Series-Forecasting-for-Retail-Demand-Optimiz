export const Avatar = ({ src, alt }: { src: string; alt: string }) => (
  <img
    src={src}
    alt={alt}
    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
  />
);
