package com.pharmapay.delivery.capture

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import java.io.File

class CallRecorderService : Service() {

    companion object {
        private const val TAG = "PharmaCaptureRecorder"
        const val ACTION_START = "pharmagig.capture.START"
        const val ACTION_STOP  = "pharmagig.capture.STOP"
        const val EXTRA_NUMBER = "caller_number"
        private const val NOTIF_ID   = 8901
        private const val CHANNEL_ID = "pharmagig_capture"
    }

    private var recorder: MediaRecorder? = null
    private var outputFile: File? = null
    private var callerNumber: String? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            when (intent?.action) {
                ACTION_START -> {
                    // Check RECORD_AUDIO BEFORE anything else — on API 34+,
                    // startForeground with microphone type crashes without it
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                        != PackageManager.PERMISSION_GRANTED) {
                        Log.w(TAG, "RECORD_AUDIO not granted, cannot start recording")
                        stopSelf()
                        return START_NOT_STICKY
                    }

                    callerNumber = intent.getStringExtra(EXTRA_NUMBER)
                    Log.d(TAG, "ACTION_START for caller: $callerNumber")
                    showForegroundNotification()
                    startRecording()
                }
                ACTION_STOP -> {
                    Log.d(TAG, "ACTION_STOP")
                    stopRecordingAndEnqueue()
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "onStartCommand crashed", e)
            try { stopSelf() } catch (_: Exception) {}
        }
        return START_NOT_STICKY
    }

    private fun startRecording() {
        val dir = getExternalFilesDir("call_recordings") ?: filesDir
        dir.mkdirs()
        outputFile = File(dir, "call_${System.currentTimeMillis()}.mp3")
        Log.d(TAG, "Recording to: ${outputFile?.absolutePath}")

        try {
            @Suppress("DEPRECATION")
            recorder = (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
                MediaRecorder(this) else MediaRecorder()).apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(16000)
                setAudioEncodingBitRate(64000)
                setOutputFile(outputFile!!.absolutePath)
                prepare()
                start()
            }
            Log.d(TAG, "Recording started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start recording", e)
            stopSelf()
        }
    }

    private fun stopRecordingAndEnqueue() {
        try {
            recorder?.stop()
            recorder?.release()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recorder", e)
            outputFile?.delete()
            return
        } finally {
            recorder = null
        }

        val file = outputFile ?: return
        val number = callerNumber ?: "unknown"

        if (file.length() < 8_000L) {
            Log.d(TAG, "Recording too short (${file.length()} bytes), discarding")
            file.delete()
            return
        }

        Log.d(TAG, "Enqueuing upload: ${file.name} for caller $number")
        CaptureUploadWorker.enqueue(
            context      = this,
            audioPath    = file.absolutePath,
            callerNumber = number,
            channel      = "voice"
        )
    }

    private fun showForegroundNotification() {
        val manager = getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL_ID) == null) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    "Pharmagig call capture",
                    NotificationManager.IMPORTANCE_LOW
                )
            )
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("PharmaGig")
            .setContentText("Recording call for order capture")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        // On API 34+, explicitly pass FOREGROUND_SERVICE_TYPE_MICROPHONE
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
        } else {
            startForeground(NOTIF_ID, notification)
        }
        Log.d(TAG, "Foreground notification shown")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
