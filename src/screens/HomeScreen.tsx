import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Fonts } from '../theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.ornament}>✦ ✦ ✦</Text>
        <Text style={styles.title}>Warhammer{'\n'}Roleplay</Text>
        <Text style={styles.subtitle}>
          In a world of grim peril and dark adventure,{'\n'}every choice may be your last.
        </Text>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('StorySelect')}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>✦ Begin Your Tale ✦</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  ornament: {
    color: Colors.border,
    fontSize: 14,
    letterSpacing: 8,
  },
  title: {
    fontFamily: Fonts.title,
    color: Colors.titleText,
    fontSize: 48,
    textAlign: 'center',
    lineHeight: 58,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: Fonts.body,
    color: Colors.bodyText,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  divider: {
    width: 120,
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  button: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: Colors.card,
  },
  buttonText: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.titleText,
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
  },
});
