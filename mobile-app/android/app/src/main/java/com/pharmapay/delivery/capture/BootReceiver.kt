package com.pharmapay.delivery.capture

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Android re-binds NotificationListenerService automatically after reboot.
        // PhoneStateReceiver fires on next call via the manifest broadcast receiver.
        // Nothing explicit needed — this class just keeps the component active.
    }
}
