package com.pharmapay.delivery.capture

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.media.MediaRecorder
import android.os.IBinder
import androidx.core.app.NotificationCompat
import java.io.File

class CallRecorderService : Service() {

    companion object {
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
        when (intent?.action) {
            ACTION_START -> {
                callerNumber = intent.getStringExtra(EXTRA_NUMBER)
                showForegroundNotification()
                startRecording()
            }
            ACTION_STOP -> {
                stopRecordingAndEnqueue()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun startRecording() {
        val dir = getExternalFilesDir("call_recordings") ?: filesDir
        dir.mkdirs()
        outputFile = File(dir, "call_${System.currentTimeMillis()}.mp3")

        try {
            recorder = MediaRecorder(this).apply {
                // MIC source picks up both sides when call is on speaker.
                // Store policy: clerks always put calls on speaker.
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(16000)
                setAudioEncodingBitRate(64000)
                setOutputFile(outputFile!!.absolutePath)
                prepare()
                start()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            stopSelf()
        }
    }

    private fun stopRecordingAndEnqueue() {
        try {
            recorder?.stop()
            recorder?.release()
        } catch (e: Exception) {
            outputFile?.delete()
            return
        } finally {
            recorder = null
        }

        val file = outputFile ?: return
        val number = callerNumber ?: return

        // Discard recordings under ~1 second (accidental picks)
        if (file.length() < 8_000L) { file.delete(); return }

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
        startForeground(
            NOTIF_ID,
            NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Pharmagig")
                .setContentText("Recording call for order capture")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build()
        )
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
