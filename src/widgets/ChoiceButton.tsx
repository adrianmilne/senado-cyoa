import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Choice, GameState } from '../models';
import { evaluateConditions } from '../engine/ConditionEvaluator';
import { Colors, Fonts } from '../theme';

interface Props {
  choice: Choice;
  gameState: GameState;
  onPress: (choiceId: string) => void;
}

export function ChoiceButton({ choice, gameState, onPress }: Props) {
  const conditionsMet =
    choice.conditions.length === 0 || evaluateConditions(choice.conditions, gameState);

  if (!conditionsMet && choice.hiddenIfConditionFails) {
    return null;
  }

  const disabled = !conditionsMet;

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={() => onPress(choice.id)}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <View style={styles.row}>
        <Text style={[styles.glyph, disabled && styles.glyphDisabled]}>✦</Text>
        <Text style={[styles.text, disabled && styles.textDisabled]}>{choice.text}</Text>
      </View>
      {disabled && choice.conditionFailMessage ? (
        <Text style={styles.failMessage}>{choice.conditionFailMessage}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 5,
  },
  buttonDisabled: {
    borderColor: Colors.disabled,
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  glyph: {
    color: Colors.border,
    fontSize: 10,
    marginTop: 3,
  },
  glyphDisabled: {
    color: Colors.disabled,
  },
  text: {
    fontFamily: Fonts.bodyItalic,
    color: Colors.bodyText,
    fontSize: 17,
    flex: 1,
    lineHeight: 24,
  },
  textDisabled: {
    color: Colors.disabled,
  },
  failMessage: {
    fontFamily: Fonts.body,
    color: Colors.disabled,
    fontSize: 13,
    marginTop: 4,
    marginLeft: 20,
    fontStyle: 'italic',
  },
});
