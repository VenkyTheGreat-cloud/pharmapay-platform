package com.pharmapay.delivery.capture

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("PharmaCaptureMonitor", "Boot completed — starting CaptureMonitorService")
            // Restart the persistent monitor service after device reboot
            val token = CapturePrefs.getStoreToken(context)
            if (token.isNotEmpty()) {
                try {
                    context.startForegroundService(
                        Intent(context, CaptureMonitorService::class.java)
                    )
                } catch (e: Exception) {
                    Log.e("PharmaCaptureMonitor", "Failed to start monitor on boot", e)
                }
            }
        }
    }
}
