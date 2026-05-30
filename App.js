import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import DashboardScreen from './src/screens/DashboardScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import EnrollmentScreen from './src/screens/EnrollmentScreen';
import { initDB } from './src/services/DatabaseService';

const Stack = createStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.err}>Init failed: {error}</Text>
    </View>
  );

  if (!ready) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1565C0" />
      <Text style={styles.loadText}>Loading Datalake 3.0...</Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Dashboard"
            screenOptions={{
              headerStyle: { backgroundColor: '#0D47A1' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
            }}
          >
            <Stack.Screen name="Dashboard" component={DashboardScreen}
              options={{ title: 'Datalake 3.0 · Face ID' }} />
            <Stack.Screen name="Attendance" component={AttendanceScreen}
              options={{ headerShown: false }} />
            <Stack.Screen name="Enrollment" component={EnrollmentScreen}
              options={{ title: 'Enroll Personnel' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F1E' },
  loadText: { color: '#90CAF9', marginTop: 14, fontSize: 15 },
  err: { color: 'red', margin: 20, textAlign: 'center' },
});
