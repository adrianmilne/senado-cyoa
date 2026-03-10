import React from 'react';
import { Image, StyleSheet, View, ImageSourcePropType } from 'react-native';
import { SceneImage as SceneImageModel } from '../models';
import { STORY_IMAGES } from '../assets/storyImages';

interface Props {
  image: SceneImageModel;
  basePath?: string;
}

function resolveSource(file: string, basePath?: string): ImageSourcePropType | null {
  // Remote or absolute URIs pass straight through
  if (/^(https?|file):\/\//.test(file)) {
    return { uri: file };
  }
  // Look up in the static registry keyed by full project-relative path
  if (basePath) {
    const key = basePath + file;
    const registered = STORY_IMAGES[key];
    if (registered != null) return registered;
  }
  return null;
}

export function SceneImage({ image, basePath }: Props) {
  if (!image.file) return null;

  const source = resolveSource(image.file, basePath);
  if (source == null) return null;

  const isFullScreen = image.position === 'full_screen';

  return (
    <View style={isFullScreen ? styles.fullScreenContainer : styles.container}>
      <Image
        source={source}
        style={isFullScreen ? styles.fullScreenImage : styles.image}
        accessibilityLabel={image.altText}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
});
