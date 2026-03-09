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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { Story } from '../models';
import { startStory, resumeSave } from '../engine/StateManager';
import { SaveService } from '../services/SaveService';
import { validateStory } from '../services/SchemaValidator';
import { AppDispatch, RootStackParamList } from '../navigation/AppNavigator';

// Bundled stories — add new story JSON imports here
const STORY_MODULES: Record<string, Story> = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  test_story: require('../../assets/stories/test_story/story.json') as Story,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  forest_of_shadows: require('../../assets/stories/forest_of_shadows/story.json') as Story,
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'StorySelect'>;
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
        <ActivityIndicator color="#FFC107" size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Choose a Story</Text>
      <FlatList
        data={stories}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.storyTitle}>{item.title}</Text>
            <Text style={styles.storyDesc}>{item.description}</Text>
            {item.metadata ? (
              <Text style={styles.meta}>
                ~{item.metadata.estimatedPlaytimeMinutes} min · {item.metadata.difficulty}
              </Text>
            ) : null}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => handleNewGame(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.playButtonText}>New Game</Text>
              </TouchableOpacity>
              {hasSave[item.id] ? (
                <TouchableOpacity
                  style={styles.resumeButton}
                  onPress={() => handleResume(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resumeButtonText}>Resume</Text>
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
    backgroundColor: '#1A1A2E',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    color: '#FFC107',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#2D2D44',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  storyTitle: {
    color: '#FFC107',
    fontSize: 20,
    fontWeight: '700',
  },
  storyDesc: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  playButton: {
    backgroundColor: '#FFC107',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  playButtonText: {
    color: '#1A1A2E',
    fontWeight: '700',
    fontSize: 14,
  },
  resumeButton: {
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  resumeButtonText: {
    color: '#FFC107',
    fontWeight: '600',
    fontSize: 14,
  },
});
