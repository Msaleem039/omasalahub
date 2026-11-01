import Image from "next/image";

export function DishImage({
  src,
  alt,
  className = "object-cover",
  priority = false,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (src.startsWith("data:")) {
    // Admin uploads are stored as data URLs; the Next image optimizer cannot fetch them.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`absolute inset-0 h-full w-full ${className}`} />;
  }
  return <Image src={src} alt={alt} fill unoptimized priority={priority} sizes={sizes} className={className} />;
}
