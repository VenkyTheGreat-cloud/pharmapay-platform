package com.pharmapay.delivery.capture

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat

class PhoneStateReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "PharmaCaptureReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
        Log.d(TAG, "Phone state changed: $state")

        // Normalise Indian number — strip +91 / 91 / leading 0, keep 10 digits
        val rawNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)
        val callerNumber = rawNumber
            ?.replace(Regex("^(\\+91|91|0)"), "")
            ?.filter { it.isDigit() }
            ?.takeLast(10)
            ?.takeIf { it.length == 10 }

        Log.d(TAG, "Raw number: $rawNumber, Normalized: $callerNumber")

        when (state) {
            TelephonyManager.EXTRA_STATE_RINGING -> {
                CapturePrefs.savePendingCallerNumber(context, callerNumber)
                Log.d(TAG, "Saved pending caller: $callerNumber")
            }

            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                val hasRecordPerm = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED
                Log.d(TAG, "OFFHOOK - RECORD_AUDIO permission: $hasRecordPerm")

                if (!hasRecordPerm) {
                    Log.w(TAG, "RECORD_AUDIO not granted, skipping recording")
                    return
                }

                val number = callerNumber
                    ?: CapturePrefs.getPendingCallerNumber(context)
                    ?: "unknown"

                Log.d(TAG, "Starting recording for caller: $number")
                try {
                    context.startForegroundService(
                        Intent(context, CallRecorderService::class.java).apply {
                            action = CallRecorderService.ACTION_START
                            putExtra(CallRecorderService.EXTRA_NUMBER, number)
                        }
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to start CallRecorderService", e)
                }
            }

            TelephonyManager.EXTRA_STATE_IDLE -> {
                Log.d(TAG, "IDLE - stopping recording")
                try {
                    context.startService(
                        Intent(context, CallRecorderService::class.java).apply {
                            action = CallRecorderService.ACTION_STOP
                        }
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to stop CallRecorderService", e)
                }
                CapturePrefs.savePendingCallerNumber(context, null)
            }
        }
    }
}
