import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameState } from '../models';
import { Colors, Fonts } from '../theme';

interface Props {
  gameState: GameState;
}

export function StatsBar({ gameState }: Props) {
  const healthPct = Math.max(0, Math.min(100, gameState.health));

  return (
    <View style={styles.container}>
      <View style={styles.woundsSection}>
        <Text style={styles.label}>Wounds</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${healthPct}%` }]} />
        </View>
        <Text style={styles.statText}>{gameState.health}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statItem}>
        <Text style={styles.label}>Crowns</Text>
        <Text style={styles.statText}>{gameState.gold}</Text>
      </View>
      <View style={styles.divider} />
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  woundsSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#0D0000',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.healthBar,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontFamily: Fonts.body,
    color: Colors.border,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statText: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.titleText,
    fontSize: 14,
  },
});
