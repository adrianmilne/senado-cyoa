import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Scene } from '../models';

interface Props {
  scene: Scene;
  onRetry?: (sceneId: string) => void;
  onMainMenu: () => void;
}

const endingColors: Record<string, string> = {
  good: '#4CAF50',
  neutral: '#FFC107',
  death: '#F44336',
};

export function EndingPanel({ scene, onRetry, onMainMenu }: Props) {
  const color = endingColors[scene.endingType ?? 'neutral'] ?? '#FFC107';

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { borderColor: color }]}>
        <Text style={[styles.endingLabel, { color }]}>
          {scene.endingType?.toUpperCase() ?? 'END'}
        </Text>
      </View>

      {scene.retryOptions?.allowRetry && onRetry ? (
        <TouchableOpacity
          style={[styles.button, { borderColor: color }]}
          onPress={() => onRetry(scene.retryOptions!.retryFromScene)}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { color }]}>
            {scene.retryOptions.retryLabel}
          </Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.menuButton} onPress={onMainMenu} activeOpacity={0.7}>
        <Text style={styles.menuButtonText}>Main Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 32,
    gap: 16,
  },
  badge: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  endingLabel: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 3,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  menuButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
});
