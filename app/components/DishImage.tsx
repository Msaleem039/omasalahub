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
    return <img src={src} alt={alt} className={`absolute inset-0 h-full w-full ${className}`} />;
  }
  return <Image src={src} alt={alt} fill unoptimized priority={priority} sizes={sizes} className={className} />;
}
