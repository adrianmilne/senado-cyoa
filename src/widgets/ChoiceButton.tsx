import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Choice, GameState } from '../models';
import { evaluateConditions } from '../engine/ConditionEvaluator';

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
      activeOpacity={0.7}
    >
      <Text style={[styles.text, disabled && styles.textDisabled]}>{choice.text}</Text>
      {disabled && choice.conditionFailMessage ? (
        <Text style={styles.failMessage}>{choice.conditionFailMessage}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2D2D44',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  buttonDisabled: {
    borderColor: '#555',
    backgroundColor: '#1E1E30',
  },
  text: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
  },
  textDisabled: {
    color: 'rgba(255,255,255,0.35)',
  },
  failMessage: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
