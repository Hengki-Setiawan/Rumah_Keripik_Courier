import { useRef, useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import { useAppColors } from '../../theme';

interface LottieAnimationProps {
  source: any;
  loop?: boolean;
  autoPlay?: boolean;
  size?: number;
  style?: ViewStyle;
  speed?: number;
  onAnimationFinish?: () => void;
}

export function LottieAnimation({
  source,
  loop = true,
  autoPlay = true,
  size = 120,
  style,
  speed = 1,
  onAnimationFinish,
}: LottieAnimationProps) {
  const animationRef = useRef<LottieView>(null);
  const colors = useAppColors();

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoPlay]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <LottieView
        ref={animationRef}
        source={source}
        loop={loop}
        autoPlay={autoPlay}
        speed={speed}
        style={{ width: '100%', height: '100%' }}
          onAnimationFinish={onAnimationFinish}
      />
    </View>
  );
}
