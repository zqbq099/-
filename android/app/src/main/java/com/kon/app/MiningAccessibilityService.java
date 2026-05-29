package com.kon.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;

public class MiningAccessibilityService extends AccessibilityService {

    private static int accumulatedClicks = 0;

    public static synchronized int getAndResetClicks() {
        int temp = accumulatedClicks;
        accumulatedClicks = 0;
        return temp;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Detect clicks and scrolls
        int eventType = event.getEventType();
        if (eventType == AccessibilityEvent.TYPE_VIEW_CLICKED ||
            eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED) {

            synchronized(MiningAccessibilityService.class) {
                accumulatedClicks++;
            }

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
