package com.kon.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.accessibility.AccessibilityEvent;

public class MiningAccessibilityService extends AccessibilityService {

    private static final String PREFS_NAME = "MiningPrefs";
    private static final String KEY_CLICKS = "accumulated_clicks";
    private static final String KEY_TIME = "accumulated_time_ms";
    private static final String KEY_LAST_INTERACTION = "last_interaction_time";

    private static final long SESSION_TIMEOUT_MS = 30000; // 30 seconds of inactivity ends session

    public static JSObject getAccumulatedData(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        JSObject data = new JSObject();
        data.put("clicks", prefs.getInt(KEY_CLICKS, 0));
        data.put("timeMs", prefs.getLong(KEY_TIME, 0));
        return data;
    }

    public static synchronized JSObject getAndResetData(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        JSObject data = new JSObject();
        data.put("clicks", prefs.getInt(KEY_CLICKS, 0));
        data.put("timeMs", prefs.getLong(KEY_TIME, 0));

        prefs.edit()
            .putInt(KEY_CLICKS, 0)
            .putLong(KEY_TIME, 0)
            .apply();
        return data;
    }

    private synchronized void recordInteraction() {
        long now = System.currentTimeMillis();
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        int clicks = prefs.getInt(KEY_CLICKS, 0);
        long accumulatedTime = prefs.getLong(KEY_TIME, 0);
        long lastInteraction = prefs.getLong(KEY_LAST_INTERACTION, 0);

        SharedPreferences.Editor editor = prefs.edit();

        // Increment clicks
        editor.putInt(KEY_CLICKS, clicks + 1);

        // Calculate time session
        if (lastInteraction > 0) {
            long diff = now - lastInteraction;
            if (diff < SESSION_TIMEOUT_MS) {
                editor.putLong(KEY_TIME, accumulatedTime + diff);
            }
        }

        editor.putLong(KEY_LAST_INTERACTION, now);
        editor.apply();

        // Send broadcast
        Intent intent = new Intent("com.kon.app.ACTION_DETECTED");
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        int eventType = event.getEventType();
        if (eventType == AccessibilityEvent.TYPE_VIEW_CLICKED ||
            eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED ||
            eventType == AccessibilityEvent.TYPE_VIEW_FOCUSED) {

            recordInteraction();
        }
    }

    @Override
    public void onInterrupt() {}

    // Inner JSObject replacement if not using Capacitor bridge inside service directly
    public static class JSObject {
        private int clicks;
        private long timeMs;
        public void put(String key, int val) { if(key.equals("clicks")) clicks = val; }
        public void put(String key, long val) { if(key.equals("timeMs")) timeMs = val; }
        public int getInt(String key) { return clicks; }
        public long getLong(String key) { return timeMs; }
    }
}
