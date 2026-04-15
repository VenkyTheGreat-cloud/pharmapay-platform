package com.pharmapay.delivery.capture

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat

class PhoneStateReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return

        // Normalise Indian number — strip +91 / 91 / leading 0, keep 10 digits
        val rawNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)
        val callerNumber = rawNumber
            ?.replace(Regex("^(\\+91|91|0)"), "")
            ?.filter { it.isDigit() }
            ?.takeLast(10)
            ?.takeIf { it.length == 10 }

        when (state) {
            TelephonyManager.EXTRA_STATE_RINGING -> {
                CapturePrefs.savePendingCallerNumber(context, callerNumber)
            }

            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                // Skip recording if RECORD_AUDIO permission not granted
                if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
                    != PackageManager.PERMISSION_GRANTED) return

                val number = callerNumber
                    ?: CapturePrefs.getPendingCallerNumber(context)
                    ?: return

                context.startForegroundService(
                    Intent(context, CallRecorderService::class.java).apply {
                        action = CallRecorderService.ACTION_START
                        putExtra(CallRecorderService.EXTRA_NUMBER, number)
                    }
                )
            }

            TelephonyManager.EXTRA_STATE_IDLE -> {
                context.startService(
                    Intent(context, CallRecorderService::class.java).apply {
                        action = CallRecorderService.ACTION_STOP
                    }
                )
                CapturePrefs.savePendingCallerNumber(context, null)
            }
        }
    }
}
