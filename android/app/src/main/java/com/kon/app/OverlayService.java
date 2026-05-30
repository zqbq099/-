package com.kon.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

public class OverlayService extends Service {
    private WindowManager windowManager;
    private View overlayView;
    private WindowManager.LayoutParams params;
    private TextView productText;
    private View bubble;

    private double currentProduct = 0.0;
    private int threshold = 100;

    private final BroadcastReceiver receiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("com.kon.app.UPDATE_MINING".equals(intent.getAction())) {
                currentProduct = intent.getDoubleExtra("totalProduct", 0.0);
                threshold = intent.getIntExtra("threshold", 100);
                updateUI();
            } else if ("com.kon.app.ACTION_DETECTED".equals(intent.getAction())) {
                // Real-time update of the floating UI bubble
                currentProduct += 0.1;
                updateUI();
                spawnParticle();
            }
        }
    };

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        startForegroundService();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_layout, null);

        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 100;
        params.y = 100;

        bubble = overlayView.findViewById(R.id.bubble);
        productText = overlayView.findViewById(R.id.product_text);

        bubble.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float initialTouchX;
            private float initialTouchY;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        windowManager.updateViewLayout(overlayView, params);
                        return true;
                    case MotionEvent.ACTION_UP:
                        // If it was a simple tap, we could trigger something
                        float diffX = Math.abs(event.getRawX() - initialTouchX);
                        float diffY = Math.abs(event.getRawY() - initialTouchY);
                        if (diffX < 10 && diffY < 10) {
                            // Tap action
                            Intent intent = new Intent(getApplicationContext(), MainActivity.class);
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                        }
                        return true;
                }
                return false;
            }
        });

        windowManager.addView(overlayView, params);

        IntentFilter filter = new IntentFilter();
        filter.addAction("com.kon.app.UPDATE_MINING");
        filter.addAction("com.kon.app.ACTION_DETECTED");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(receiver, filter);
        }
    }

    private void updateUI() {
        if (productText != null) {
            productText.setText(String.format("%.1f", currentProduct));
            if (currentProduct >= threshold) {
                productText.setTextColor(0xFF00FF00); // Green if ready
            } else {
                productText.setTextColor(0xFFFFFFFF);
            }
        }
    }

    private void spawnParticle() {
        if (overlayView == null) return;

        final TextView particle = new TextView(this);
        particle.setText("$");
        particle.setTextColor(Color.parseColor("#80FFFFFF")); // Translucent white
        particle.setTextSize(12);
        particle.setAlpha(0.8f);

        WindowManager.LayoutParams p = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                params.type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                PixelFormat.TRANSLUCENT
        );
        p.gravity = Gravity.TOP | Gravity.START;
        // Position near the bubble but with slight randomness
        p.x = params.x + 40 + (int)(Math.random() * 40 - 20);
        p.y = params.y - 20;

        windowManager.addView(particle, p);

        // Animation: Float up and fade
        final Handler handler = new Handler(Looper.getMainLooper());
        final int startY = p.y;
        final WindowManager.LayoutParams finalP = p;

        Runnable animation = new Runnable() {
            int frames = 0;
            @Override
            public void run() {
                if (frames < 20) {
                    finalP.y -= 5;
                    particle.setAlpha(particle.getAlpha() - 0.04f);
                    try {
                        windowManager.updateViewLayout(particle, finalP);
                        frames++;
                        handler.postDelayed(this, 30);
                    } catch (Exception e) {
                        // View might have been removed
                    }
                } else {
                    try {
                        windowManager.removeView(particle);
                    } catch (Exception e) {}
                }
            }
        };
        handler.post(animation);
    }

    private void startForegroundService() {
        String channelId = "MiningOverlayChannel";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId, "Kon Mining Overlay", NotificationManager.IMPORTANCE_LOW);
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }

        Notification notification = null;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            notification = new Notification.Builder(this, channelId)
                    .setContentTitle("Kon Mining Active")
                    .setContentText("الزر العائم نشط حالياً")
                    .setSmallIcon(android.R.drawable.ic_menu_info_details)
                    .build();
        }
        startForeground(1, notification);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (overlayView != null) windowManager.removeView(overlayView);
        unregisterReceiver(receiver);
    }
}
