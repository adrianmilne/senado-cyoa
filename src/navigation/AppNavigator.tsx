import React from 'react';
import { Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  StackCardInterpolationProps,
  StackCardInterpolatedStyle,
} from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { store } from '../engine/StateManager';
import { HomeScreen } from '../screens/HomeScreen';
import { StorySelectScreen } from '../screens/StorySelectScreen';
import { SceneScreen } from '../screens/SceneScreen';
import { Colors } from '../theme';

export type RootStackParamList = {
  Home: undefined;
  StorySelect: undefined;
  Scene: undefined;
};

export type { RootState, AppDispatch } from '../engine/StateManager';
export { store } from '../engine/StateManager';

function forFade({ current }: StackCardInterpolationProps): StackCardInterpolatedStyle {
  return {
    cardStyle: {
      opacity: current.progress as unknown as Animated.AnimatedInterpolation<number>,
    },
  };
}

const Stack = createStackNavigator<RootStackParamList>();

function Navigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: Colors.background },
          gestureEnabled: false,
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 600 } },
            close: { animation: 'timing', config: { duration: 600 } },
          },
          cardStyleInterpolator: forFade,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="StorySelect" component={StorySelectScreen} />
        <Stack.Screen name="Scene" component={SceneScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function AppNavigator() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Navigator />
      </GestureHandlerRootView>
    </Provider>
  );
}
