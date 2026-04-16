package com.pharmapay.delivery.capture

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * Persistent foreground service that monitors phone call state.
 *
 * This replaces the manifest-registered PhoneStateReceiver which
 * does not reliably receive broadcasts on Android 12+ due to
 * background execution limits.
 *
 * The service runs continuously with a low-priority notification
 * and uses TelephonyCallback (API 31+) or PhoneStateListener
 * (older APIs) to detect incoming calls.
 */
class CaptureMonitorService : Service() {

    companion object {
        private const val TAG = "PharmaCaptureMonitor"
        private const val NOTIF_ID = 8900
        private const val CHANNEL_ID = "pharmagig_monitor"
        const val ACTION_START_MONITOR = "pharmagig.monitor.START"
        const val ACTION_STOP_MONITOR = "pharmagig.monitor.STOP"
    }

    private var telephonyManager: TelephonyManager? = null
    private var telephonyCallback: Any? = null  // TelephonyCallback on API 31+
    @Suppress("DEPRECATION")
    private var phoneStateListener: PhoneStateListener? = null
    private var isRecording = false
    private var pendingCallerNumber: String? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "CaptureMonitorService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_MONITOR -> {
                Log.d(TAG, "Stopping monitor service")
                unregisterCallListener()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
        }

        Log.d(TAG, "Starting monitor service")
        showMonitorNotification()
        registerCallListener()
        return START_STICKY  // Restart if killed by system
    }

    private fun registerCallListener() {
        telephonyManager = getSystemService(TelephonyManager::class.java)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            registerTelephonyCallback()
        } else {
            registerPhoneStateListener()
        }
    }

    @RequiresApi(Build.VERSION_CODES.S)
    private fun registerTelephonyCallback() {
        val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
            override fun onCallStateChanged(state: Int) {
                handleCallState(state)
            }
        }
        telephonyCallback = callback
        telephonyManager?.registerTelephonyCallback(mainExecutor, callback)
        Log.d(TAG, "TelephonyCallback registered (API 31+)")
    }

    @Suppress("DEPRECATION")
    private fun registerPhoneStateListener() {
        val listener = object : PhoneStateListener() {
            override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                if (!phoneNumber.isNullOrEmpty()) {
                    pendingCallerNumber = normalizeNumber(phoneNumber)
                }
                handleCallState(state)
            }
        }
        phoneStateListener = listener
        telephonyManager?.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
        Log.d(TAG, "PhoneStateListener registered (legacy)")
    }

    private fun handleCallState(state: Int) {
        Log.d(TAG, "Call state changed: $state (IDLE=0, RINGING=1, OFFHOOK=2), isRecording=$isRecording")

        when (state) {
            TelephonyManager.CALL_STATE_RINGING -> {
                // Try to read caller number from call log after a short delay
                Log.d(TAG, "RINGING — waiting for OFFHOOK")
            }

            TelephonyManager.CALL_STATE_OFFHOOK -> {
                if (isRecording) {
                    Log.d(TAG, "Already recording, skipping")
                    return
                }

                if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                    != PackageManager.PERMISSION_GRANTED) {
                    Log.w(TAG, "RECORD_AUDIO not granted, skipping recording")
                    return
                }

                val number = pendingCallerNumber ?: getLastCallerFromLog() ?: "unknown"
                Log.d(TAG, "OFFHOOK — starting recording for: $number")

                try {
                    startForegroundService(
                        Intent(this, CallRecorderService::class.java).apply {
                            action = CallRecorderService.ACTION_START
                            putExtra(CallRecorderService.EXTRA_NUMBER, number)
                        }
                    )
                    isRecording = true
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to start CallRecorderService", e)
                }
            }

            TelephonyManager.CALL_STATE_IDLE -> {
                if (!isRecording) return

                Log.d(TAG, "IDLE — stopping recording")
                try {
                    startService(
                        Intent(this, CallRecorderService::class.java).apply {
                            action = CallRecorderService.ACTION_STOP
                        }
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to stop CallRecorderService", e)
                }
                isRecording = false
                pendingCallerNumber = null
            }
        }
    }

    private fun getLastCallerFromLog(): String? {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CALL_LOG)
            != PackageManager.PERMISSION_GRANTED) return null

        return try {
            val cursor = contentResolver.query(
                android.provider.CallLog.Calls.CONTENT_URI,
                arrayOf(android.provider.CallLog.Calls.NUMBER),
                "${android.provider.CallLog.Calls.TYPE} = ?",
                arrayOf(android.provider.CallLog.Calls.INCOMING_TYPE.toString()),
                "${android.provider.CallLog.Calls.DATE} DESC"
            )
            cursor?.use {
                if (it.moveToFirst()) normalizeNumber(it.getString(0)) else null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to read call log", e)
            null
        }
    }

    private fun normalizeNumber(raw: String?): String? {
        return raw
            ?.replace(Regex("^(\\+91|91|0)"), "")
            ?.filter { it.isDigit() }
            ?.takeLast(10)
            ?.takeIf { it.length == 10 }
    }

    private fun unregisterCallListener() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (telephonyCallback as? TelephonyCallback)?.let {
                telephonyManager?.unregisterTelephonyCallback(it)
            }
        } else {
            @Suppress("DEPRECATION")
            phoneStateListener?.let {
                telephonyManager?.listen(it, PhoneStateListener.LISTEN_NONE)
            }
        }
        telephonyCallback = null
        phoneStateListener = null
        Log.d(TAG, "Call listener unregistered")
    }

    private fun showMonitorNotification() {
        val manager = getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL_ID) == null) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    "PharmaGig Order Capture",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Monitors incoming calls for order capture"
                    setShowBadge(false)
                }
            )
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("PharmaGig")
            .setContentText("Order capture active")
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        startForeground(NOTIF_ID, notification)
        Log.d(TAG, "Monitor notification shown")
    }

    override fun onDestroy() {
        Log.d(TAG, "CaptureMonitorService destroyed")
        unregisterCallListener()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
