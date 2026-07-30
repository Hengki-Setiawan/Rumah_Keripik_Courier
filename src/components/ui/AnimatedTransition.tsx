import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeInDown,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
  ZoomOut,
  LightSpeedInRight,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
} from 'react-native-reanimated';
import { useReducedMotionSafe } from '../../hooks/useMicroInteraction';
import type { ReactNode } from 'react';

type AnimationType = 'fade' | 'fadeUp' | 'fadeDown' | 'slideRight' | 'slideLeft' | 'zoom' | 'lightSpeed';

interface AnimatedTransitionProps {
  children: ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  exiting?: boolean;
}

const animationMap: Record<AnimationType, { entering: any; exiting: any }> = {
  fade: { entering: FadeIn, exiting: FadeOut },
  fadeUp: { entering: FadeInUp, exiting: FadeOut },
  fadeDown: { entering: FadeInDown, exiting: FadeOut },
  slideRight: { entering: SlideInRight, exiting: SlideInLeft },
  slideLeft: { entering: SlideInLeft, exiting: SlideInRight },
  zoom: { entering: ZoomIn, exiting: ZoomOut },
  lightSpeed: { entering: LightSpeedInRight, exiting: FadeOut },
};

export function AnimatedTransition({
  children,
  type = 'fadeUp',
  delay = 0,
  duration = 300,
  exiting = true,
}: AnimatedTransitionProps) {
  const anim = animationMap[type];
  return (
    <Animated.View
      entering={anim.entering.duration(duration).delay(delay)}
      exiting={exiting ? anim.exiting.duration(duration / 2) : undefined}
    >
      {children}
    </Animated.View>
  );
}

export function StaggeredList({
  children,
  staggerDelay = 80,
  animation = 'fadeUp',
}: {
  children: ReactNode[];
  staggerDelay?: number;
  animation?: AnimationType;
}) {
  return (
    <>
      {children.map((child, index) => (
        <AnimatedTransition
          key={index}
          type={animation}
          delay={index * staggerDelay}
        >
          {child}
        </AnimatedTransition>
      ))}
    </>
  );
}
