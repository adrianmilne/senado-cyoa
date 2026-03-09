import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from '../engine/StateManager';
import { HomeScreen } from '../screens/HomeScreen';
import { StorySelectScreen } from '../screens/StorySelectScreen';
import { SceneScreen } from '../screens/SceneScreen';

export type RootStackParamList = {
  Home: undefined;
  StorySelect: undefined;
  Scene: undefined;
};

export type { RootState, AppDispatch } from '../engine/StateManager';
export { store } from '../engine/StateManager';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1A1A2E' },
          animation: 'fade',
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
      <Navigator />
    </Provider>
  );
}
