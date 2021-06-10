import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";

const TEST_KEY = "some-async-storage-key";
const TEST_VALUE = "Hello, world!";

/**
 * Background task that executes when location changes.
 *
 * We expect to be able to access values stored in AsyncStorage,
 * regardless of whether app is headless or not.
 *
 */
TaskManager.defineTask("LOCATION_TASK", async ({ executionInfo }) => {
  const val = await AsyncStorage.getItem(TEST_KEY);
  presentLocalNotification(
    "Location updated!",
    JSON.stringify({
      appState: executionInfo.appState,
      headless: Constants.isHeadless,
      asyncStorageVal: val,
    })
  );
});

/**
 * Present debug alerts as local notifications, so we can see them
 * while application is backgrounded or killed.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function presentLocalNotification(title: string, body?: string | null) {
  return Notifications.scheduleNotificationAsync({
    content: { title: title, body: body ?? "" },
    trigger: null,
  });
}

export default function App() {
  /**
   * Request necessary permissions when app mounts.
   */
  useEffect(() => {
    async function requestPermissionsAsync() {
      await Notifications.requestPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
      await Location.requestBackgroundPermissionsAsync();
    }

    requestPermissionsAsync();
  }, []);

  return (
    <View style={styles.container}>
      <Button
        title="Start watching location"
        onPress={async () => {
          await AsyncStorage.setItem(TEST_KEY, TEST_VALUE);
          await presentLocalNotification(
            "Value saved to AsyncStorage!",
            TEST_VALUE
          );

          await Location.startLocationUpdatesAsync("LOCATION_TASK", {
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 50,
            showsBackgroundLocationIndicator: true,
          });
          await presentLocalNotification("Task started!");
        }}
      />
      <Button
        title="Stop watching location"
        onPress={async () => {
          await Location.stopLocationUpdatesAsync("LOCATION_TASK");
          await presentLocalNotification("Task stopped!");
        }}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
