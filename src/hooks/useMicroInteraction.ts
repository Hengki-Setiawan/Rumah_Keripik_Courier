import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  useReducedMotion,
  FadeInUp,
  FadeIn,
  FadeInDown,
  ZoomIn,
  ZoomOut,
  SlideInRight,
  SlideInLeft,
  LightSpeedInRight,
  BounceIn,
  FlipInXUp,
  FlipInYRight,
  StretchInX,
  StretchInY,
} from 'react-native-reanimated';

export function usePressAnimation() {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const onPressIn = () => { scale.value = withSpring(0.97, { stiffness: 300, damping: 10 }); };
  const onPressOut = () => { scale.value = withSpring(1, { stiffness: 300, damping: 10 }); };
  return { animatedStyle, onPressIn, onPressOut };
}

export function useShakeAnimation() {
  const translateX = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const shake = () => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 40, easing: Easing.inOut(Easing.ease) }),
      withTiming(10, { duration: 40 }),
      withTiming(-8, { duration: 40 }),
      withTiming(8, { duration: 40 }),
      withTiming(-5, { duration: 40 }),
      withTiming(5, { duration: 40 }),
      withTiming(0, { duration: 40 }),
    );
  };
  return { animatedStyle, shake };
}

export function usePulseAnimation(initialScale = 1) {
  const scale = useSharedValue(initialScale);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const startPulse = () => {
    scale.value = withRepeat(
      withSequence(
        withTiming(initialScale * 1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialScale, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  };
  const stopPulse = () => { scale.value = withTiming(initialScale, { duration: 200 }); };
  return { animatedStyle, startPulse, stopPulse };
}

export function useSlideAnimation(direction: 'left' | 'right' | 'up' | 'down' = 'up') {
  const offset = useSharedValue(100);
  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    const transform = direction === 'up' ? [{ translateY: offset.value }]
      : direction === 'down' ? [{ translateY: -offset.value }]
      : direction === 'left' ? [{ translateX: offset.value }]
      : [{ translateX: -offset.value }];
    return { opacity: opacity.value, transform };
  });
  const animateIn = () => {
    offset.value = withSpring(0, { stiffness: 100, damping: 15 });
    opacity.value = withTiming(1, { duration: 200 });
  };
  return { animatedStyle, animateIn };
}

export function useScaleIn() {
  const entering = FadeIn.duration(300).springify().damping(12);
  return entering;
}

export const StaggerFadeInUp = (index: number, baseDelay = 80) =>
  FadeInUp.duration(300).delay(index * baseDelay).springify().damping(14);

export const StaggerFadeIn = (index: number, baseDelay = 100) =>
  FadeIn.duration(250).delay(index * baseDelay);

export const StaggerZoomIn = (index: number, baseDelay = 80) =>
  ZoomIn.duration(300).delay(index * baseDelay).springify().damping(12);

export const StaggerSlideRight = (index: number, baseDelay = 80) =>
  SlideInRight.duration(300).delay(index * baseDelay).springify().damping(14);

export const StaggerBounceIn = (index: number, baseDelay = 100) =>
  BounceIn.duration(400).delay(index * baseDelay).springify().damping(12);

export const StaggerFlipIn = (index: number, baseDelay = 80) =>
  FlipInXUp.duration(350).delay(index * baseDelay).springify().damping(12);

export const EntranceFadeDown = () =>
  FadeInDown.duration(400).springify().damping(12);

export const EntranceLightSpeed = () =>
  LightSpeedInRight.duration(500).springify().damping(12);

export function useReducedMotionSafe() {
  const reduced = useReducedMotion();
  if (reduced) {
    return { entering: FadeIn.duration(100) };
  }
  return { entering: FadeInUp.duration(300).springify().damping(14) };
}
