import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameState } from '../models';

interface Props {
  gameState: GameState;
}

export function StatsBar({ gameState }: Props) {
  const healthPct = Math.max(0, Math.min(100, gameState.health));
  const barColor =
    healthPct > 50 ? '#4CAF50' : healthPct > 25 ? '#FFC107' : '#F44336';

  return (
    <View style={styles.container}>
      <View style={styles.healthSection}>
        <Text style={styles.label}>HP</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${healthPct}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={styles.statText}>{gameState.health}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.label}>Gold</Text>
        <Text style={styles.statText}>{gameState.gold}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.label}>Items</Text>
        <Text style={styles.statText}>{gameState.inventory.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  healthSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#2D2D44',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  label: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '500',
  },
});
