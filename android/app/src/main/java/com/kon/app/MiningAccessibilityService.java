package com.kon.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.accessibility.AccessibilityEvent;

public class MiningAccessibilityService extends AccessibilityService {

    private static final String PREFS_NAME = "MiningPrefs";
    private static final String KEY_CLICKS = "accumulated_clicks";

    public static int getAccumulatedClicks(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return prefs.getInt(KEY_CLICKS, 0);
    }

    public static synchronized int getAndResetClicks(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        int clicks = prefs.getInt(KEY_CLICKS, 0);
        prefs.edit().putInt(KEY_CLICKS, 0).apply();
        return clicks;
    }

    private synchronized void incrementClicks() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        int clicks = prefs.getInt(KEY_CLICKS, 0);
        prefs.edit().putInt(KEY_CLICKS, clicks + 1).apply();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Detect clicks and scrolls
        int eventType = event.getEventType();
        if (eventType == AccessibilityEvent.TYPE_VIEW_CLICKED ||
            eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED) {

            incrementClicks();

            // Send broadcast to the app/overlay that an action happened
            Intent intent = new Intent("com.kon.app.ACTION_DETECTED");
            intent.setPackage(getPackageName());
            sendBroadcast(intent);
        }
    }

    @Override
    public void onInterrupt() {
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
    }
}
