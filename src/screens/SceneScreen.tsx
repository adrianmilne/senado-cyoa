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
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch, RootStackParamList } from '../navigation/AppNavigator';
import { makeChoice, retryFromScene } from '../engine/StateManager';
import { StatsBar } from '../widgets/StatsBar';
import { SceneImage } from '../widgets/SceneImage';
import { ChoiceButton } from '../widgets/ChoiceButton';
import { EndingPanel } from '../widgets/EndingPanel';
import { Colors, Fonts } from '../theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Scene'>;
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
      duration: 600,
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
      {fullImage ? <SceneImage image={fullImage} basePath={story.imageConfig.basePath} /> : null}
      <StatsBar gameState={gameState} />
      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        contentContainerStyle={styles.content}
      >
        {topImage ? <SceneImage image={topImage} basePath={story.imageConfig.basePath} /> : null}

        <View style={styles.sceneTitleRow}>
          <View style={styles.titleLine} />
          <Text style={styles.titleGlyph}>✦</Text>
          <Text style={styles.sceneTitle}>{scene.title}</Text>
          <Text style={styles.titleGlyph}>✦</Text>
          <View style={styles.titleLine} />
        </View>

        <View style={styles.ruledLine} />

        <Text style={styles.sceneText}>{scene.text}</Text>

        {bottomImage ? <SceneImage image={bottomImage} basePath={story.imageConfig.basePath} /> : null}

        {isEnding ? (
          <EndingPanel
            scene={scene}
            onRetry={scene.retryOptions?.allowRetry ? handleRetry : undefined}
            onMainMenu={handleMainMenu}
          />
        ) : (
          <View style={styles.choices}>
            <Text style={styles.choicesHeader}>What do you do?</Text>
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
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  sceneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.6,
  },
  titleGlyph: {
    fontFamily: Fonts.body,
    color: Colors.border,
    fontSize: 10,
  },
  sceneTitle: {
    fontFamily: Fonts.title,
    color: Colors.titleText,
    fontSize: 22,
    letterSpacing: 1,
    flexShrink: 1,
  },
  ruledLine: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
    opacity: 0.5,
  },
  sceneText: {
    fontFamily: Fonts.body,
    color: Colors.bodyText,
    fontSize: 18,
    lineHeight: 30,
    marginBottom: 28,
  },
  choices: {
    gap: 2,
  },
  choicesHeader: {
    fontFamily: Fonts.body,
    color: Colors.border,
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
});
