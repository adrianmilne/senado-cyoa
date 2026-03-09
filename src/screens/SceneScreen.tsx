import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootState, AppDispatch, RootStackParamList } from '../navigation/AppNavigator';
import { makeChoice, retryFromScene } from '../engine/StateManager';
import { StatsBar } from '../widgets/StatsBar';
import { SceneImage } from '../widgets/SceneImage';
import { ChoiceButton } from '../widgets/ChoiceButton';
import { EndingPanel } from '../widgets/EndingPanel';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Scene'>;
};

export function SceneScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const story = useSelector((s: RootState) => s.game.story);
  const gameState = useSelector((s: RootState) => s.game.gameState);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [gameState?.currentSceneId, fadeAnim]);

  if (!story || !gameState) {
    navigation.navigate('Home');
    return null;
  }

  const scene = story.scenes[gameState.currentSceneId];
  if (!scene) return null;

  const isEnding = scene.type === 'ending';
  const topImage = scene.image?.position === 'top' ? scene.image : undefined;
  const bottomImage = scene.image?.position === 'bottom' ? scene.image : undefined;
  const fullImage = scene.image?.position === 'full_screen' ? scene.image : undefined;

  const handleChoice = (choiceId: string) => {
    dispatch(makeChoice({ choiceId }));
  };

  const handleRetry = (sceneId: string) => {
    dispatch(retryFromScene({ sceneId }));
  };

  const handleMainMenu = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {fullImage ? <SceneImage image={fullImage} /> : null}
      <StatsBar gameState={gameState} />
      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        contentContainerStyle={styles.content}
      >
        {topImage ? <SceneImage image={topImage} /> : null}

        <Text style={styles.sceneTitle}>{scene.title}</Text>
        <Text style={styles.sceneText}>{scene.text}</Text>

        {bottomImage ? <SceneImage image={bottomImage} /> : null}

        {isEnding ? (
          <EndingPanel
            scene={scene}
            onRetry={scene.retryOptions?.allowRetry ? handleRetry : undefined}
            onMainMenu={handleMainMenu}
          />
        ) : (
          <View style={styles.choices}>
            {scene.choices.map(choice => (
              <ChoiceButton
                key={choice.id}
                choice={choice}
                gameState={gameState}
                onPress={handleChoice}
              />
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sceneTitle: {
    color: '#FFC107',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  sceneText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 24,
  },
  choices: {
    gap: 4,
  },
});
