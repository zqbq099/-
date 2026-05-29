package com.kon.app.plugins;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.kon.app.MiningAccessibilityService;
import com.kon.app.OverlayService;

@CapacitorPlugin(name = "MiningBridge")
public class MiningBridgePlugin extends Plugin {

    private BroadcastReceiver actionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("com.kon.app.ACTION_DETECTED".equals(intent.getAction())) {
                notifyListeners("actionDetected", new JSObject());
            }
        }
    };

    @Override
    public void load() {
        super.load();
        IntentFilter filter = new IntentFilter("com.kon.app.ACTION_DETECTED");
        getContext().registerReceiver(actionReceiver, filter);
    }

    @PluginMethod
    public void startOverlay(PluginCall call) {
        if (!Settings.canDrawOverlays(getContext())) {
            call.reject("Permission denied: Overlay");
            return;
        }
        Intent intent = new Intent(getContext(), OverlayService.class);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void stopOverlay(PluginCall call) {
        Intent intent = new Intent(getContext(), OverlayService.class);
        getContext().stopService(intent);
        call.resolve();
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("overlay", Settings.canDrawOverlays(getContext()));
        // Check accessibility service status
        boolean isAccessibilityEnabled = isAccessibilityServiceEnabled();
        ret.put("accessibility", isAccessibilityEnabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (!Settings.canDrawOverlays(getContext())) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }

        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);

        call.resolve();
    }

    @PluginMethod
    public void getAccumulatedClicks(PluginCall call) {
        int clicks = MiningAccessibilityService.getAndResetClicks();
        JSObject ret = new JSObject();
        ret.put("clicks", clicks);
        call.resolve(ret);
    }

    @PluginMethod
    public void updateMiningData(PluginCall call) {
        double totalProduct = call.getDouble("totalProduct", 0.0);
        int threshold = call.getInt("threshold", 100);

        // Broadcast to overlay service
        Intent intent = new Intent("com.kon.app.UPDATE_MINING");
        intent.putExtra("totalProduct", totalProduct);
        intent.putExtra("threshold", threshold);
        getContext().sendBroadcast(intent);

        call.resolve();
    }

    private boolean isAccessibilityServiceEnabled() {
        String service = getContext().getPackageName() + "/com.kon.app.MiningAccessibilityService";
        int accessibilityEnabled = 0;
        try {
            accessibilityEnabled = Settings.Secure.getInt(getContext().getContentResolver(),
                    android.provider.Settings.Secure.ACCESSIBILITY_ENABLED);
        } catch (Settings.SettingNotFoundException e) {
            return false;
        }
        if (accessibilityEnabled == 1) {
            String settingValue = Settings.Secure.getString(getContext().getContentResolver(),
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (settingValue != null) {
                return settingValue.contains(service);
            }
        }
        return false;
    }
}
