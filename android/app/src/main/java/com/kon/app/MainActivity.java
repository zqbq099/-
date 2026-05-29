package com.kon.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.kon.app.plugins.MiningBridgePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(MiningBridgePlugin.class);
    }
}
