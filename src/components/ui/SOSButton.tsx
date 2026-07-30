import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface SOSButtonProps {
  onTrigger: () => void;
  holdDuration?: number;
}

export default function SOSButton({ onTrigger, holdDuration = 2000 }: SOSButtonProps) {
  const [pressing, setPressing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTime = useRef(0);

  function handlePressIn() {
    setPressing(true);
    startTime.current = Date.now();
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: holdDuration,
        useNativeDriver: false,
      }),
    ]).start();

    holdTimer.current = setTimeout(() => {
      setPressing(false);
      scaleAnim.setValue(1);
      progressAnim.setValue(0);
      onTrigger();
    }, holdDuration);
  }

  function handlePressOut() {
    setPressing(false);
    scaleAnim.setValue(1);
    progressAnim.setValue(0);
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchArea}
      >
        <Animated.View style={[styles.button, { transform: [{ scale: scaleAnim }] }]}>
          {pressing && (
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          )}
          <Text style={styles.icon}>🆘</Text>
          <Text style={styles.label}>SOS</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 999,
  },
  touchArea: {
    borderRadius: borderRadius.full,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.sosButton,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    marginTop: 1,
  },
});
