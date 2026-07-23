import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '@/src/components/Logo';
import { Colors, FontFamily } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo pops in with bounce, then text fades up
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/home');
    }, 2600);

    return () => clearTimeout(timer);
  }, [opacity, scale, translateY, taglineOpacity, router]);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Logo size={150} />
      </Animated.View>

      {/* Title + subtitle slide up */}
      <Animated.View
        style={{
          transform: [{ translateY }],
          opacity: taglineOpacity,
          alignItems: 'center',
        }}
      >
        <Text style={styles.title}>Same Page</Text>
        <Text style={styles.subtitle}>Think alike. Score together.</Text>
      </Animated.View>

      {/* Bottom tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        A consensus party game
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    marginBottom: 14,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 42,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  tagline: {
    position: 'absolute',
    bottom: 52,
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.textDisabled,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
