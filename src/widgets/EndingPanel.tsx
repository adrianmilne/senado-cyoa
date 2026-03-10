import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Scene } from '../models';
import { Colors, Fonts } from '../theme';

interface Props {
  scene: Scene;
  onRetry?: (sceneId: string) => void;
  onMainMenu: () => void;
}

const endingAccents: Record<string, string> = {
  good: Colors.endingGood,
  death: Colors.endingDeath,
  neutral: Colors.endingNeutral,
};

const endingLabels: Record<string, string> = {
  good: '✦ Victory ✦',
  death: '✦ Slain ✦',
  neutral: '✦ Fate Sealed ✦',
};

export function EndingPanel({ scene, onRetry, onMainMenu }: Props) {
  const accent = endingAccents[scene.endingType ?? 'neutral'] ?? Colors.endingNeutral;
  const label = endingLabels[scene.endingType ?? 'neutral'] ?? '✦ End ✦';

  return (
    <View style={styles.container}>
      <View style={[styles.banner, { borderColor: accent }]}>
        <Text style={[styles.endingLabel, { color: Colors.titleText }]}>{label}</Text>
      </View>

      {scene.retryOptions?.allowRetry && onRetry ? (
        <TouchableOpacity
          style={[styles.button, { borderColor: accent }]}
          onPress={() => onRetry(scene.retryOptions!.retryFromScene)}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { color: Colors.titleText }]}>
            {scene.retryOptions.retryLabel}
          </Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.menuButton} onPress={onMainMenu} activeOpacity={0.7}>
        <Text style={styles.menuButtonText}>— Return to the Tavern —</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 40,
    gap: 20,
  },
  banner: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  endingLabel: {
    fontFamily: Fonts.title,
    fontSize: 28,
    letterSpacing: 2,
  },
  button: {
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  buttonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    letterSpacing: 1,
  },
  menuButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  menuButtonText: {
    fontFamily: Fonts.body,
    color: Colors.disabled,
    fontSize: 14,
    letterSpacing: 1,
  },
});
