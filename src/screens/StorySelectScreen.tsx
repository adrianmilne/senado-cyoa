import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import { Story } from '../models';
import { startStory, resumeSave } from '../engine/StateManager';
import { SaveService } from '../services/SaveService';
import { validateStory } from '../services/SchemaValidator';
import { AppDispatch, RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Fonts } from '../theme';

const STORY_MODULES: Record<string, Story> = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  test_story: require('../../assets/stories/test_story/story.json') as Story,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  forest_of_shadows: require('../../assets/stories/forest_of_shadows/story.json') as Story,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mist_of_bravora: require('../../assets/stories/the_mists_of_bravora/story.json') as Story,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  beast_of_blackridge: require('../../assets/stories/the_beast_of_blackridge/story.json') as Story,
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'StorySelect'>;
};

export function StorySelectScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [stories, setStories] = useState<Story[]>([]);
  const [hasSave, setHasSave] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const valid: Story[] = [];
      const saves: Record<string, boolean> = {};
      for (const story of Object.values(STORY_MODULES)) {
        const errors = validateStory(story);
        if (errors.length === 0) {
          valid.push(story);
          saves[story.id] = await SaveService.hasSave(story.id);
        }
      }
      setStories(valid);
      setHasSave(saves);
      setLoading(false);
    };
    load();
  }, []);

  const handleNewGame = (story: Story) => {
    dispatch(startStory(story));
    navigation.navigate('Scene');
  };

  const handleResume = async (story: Story) => {
    const saved = await SaveService.load(story.id);
    if (saved) {
      dispatch(resumeSave({ story, savedState: saved }));
      navigation.navigate('Scene');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.titleText} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>─── ✦ Choose Your Tale ✦ ───</Text>
      <FlatList
        data={stories}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.storyTitle}>{item.title}</Text>
            <View style={styles.cardDivider} />
            <Text style={styles.storyDesc}>{item.description}</Text>
            {item.metadata ? (
              <Text style={styles.meta}>
                {item.metadata.difficulty} · ~{item.metadata.estimatedPlaytimeMinutes} min
              </Text>
            ) : null}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleNewGame(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>✦ New Game</Text>
              </TouchableOpacity>
              {hasSave[item.id] ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => handleResume(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>Continue</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    fontFamily: Fonts.title,
    color: Colors.titleText,
    fontSize: 20,
    textAlign: 'center',
    paddingVertical: 24,
    letterSpacing: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    gap: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.4,
  },
  storyTitle: {
    fontFamily: Fonts.title,
    color: Colors.titleText,
    fontSize: 26,
    letterSpacing: 1,
  },
  storyDesc: {
    fontFamily: Fonts.body,
    color: Colors.bodyText,
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  meta: {
    fontFamily: Fonts.body,
    color: Colors.disabled,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.titleText,
    fontSize: 14,
    letterSpacing: 1,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontFamily: Fonts.body,
    color: Colors.bodyText,
    fontSize: 14,
    letterSpacing: 1,
  },
});
