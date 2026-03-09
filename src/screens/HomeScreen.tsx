import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose Your{'\n'}Adventure</Text>
        <Text style={styles.subtitle}>Stories that shape with your choices</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('StorySelect')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Begin Adventure</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  title: {
    color: '#FFC107',
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 50,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: 16,
  },
  buttonText: {
    color: '#1A1A2E',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
