import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SceneImage as SceneImageModel } from '../models';

interface Props {
  image: SceneImageModel;
}

export function SceneImage({ image }: Props) {
  if (!image.file) return null;

  const isFullScreen = image.position === 'full_screen';

  return (
    <View style={isFullScreen ? styles.fullScreenContainer : styles.container}>
      <Image
        source={{ uri: image.file }}
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
