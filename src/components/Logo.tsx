import { Image } from 'expo-image';

/**
 * The Same Page brand mark: two overlapping pages with a check on the front,
 * on the green 3D brand tile. Renders the actual icon asset so it stays pixel
 * identical to the app icon (assets/images/splash-icon.png).
 *
 * `size` is the box the image is laid out in; the tile itself has built-in
 * transparent padding, so the visible mark is a bit smaller than `size`.
 */
export function Logo({ size = 120 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/images/splash-icon.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
