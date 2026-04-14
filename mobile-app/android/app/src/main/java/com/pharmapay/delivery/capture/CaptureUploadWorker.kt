package com.pharmapay.delivery.capture

import android.content.Context
import androidx.work.*
import java.io.File
import java.util.concurrent.TimeUnit

class CaptureUploadWorker(
    ctx: Context, params: WorkerParameters
) : CoroutineWorker(ctx, params) {

    companion object {
        fun enqueue(
            context: Context,
            audioPath: String?   = null,
            messageText: String? = null,
            senderName: String?  = null,
            callerNumber: String?,
            channel: String
        ) {
            WorkManager.getInstance(context).enqueueUniqueWork(
                "capture_${channel}_${System.currentTimeMillis()}",
                ExistingWorkPolicy.APPEND_OR_REPLACE,
                OneTimeWorkRequestBuilder<CaptureUploadWorker>()
                    .setInputData(workDataOf(
                        "audio_path"    to audioPath,
                        "message_text"  to messageText,
                        "sender_name"   to senderName,
                        "caller_number" to callerNumber,
                        "channel"       to channel
                    ))
                    .setConstraints(
                        Constraints.Builder()
                            .setRequiredNetworkType(NetworkType.CONNECTED)
                            .build()
                    )
                    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                    .addTag("pharmagig_capture")
                    .build()
            )
        }
    }

    override suspend fun doWork(): Result {
        val channel      = inputData.getString("channel")      ?: return Result.failure()
        val callerNumber = inputData.getString("caller_number")
        val api          = CaptureApiClient(applicationContext)

        return when (channel) {
            "voice" -> {
                val file = File(inputData.getString("audio_path") ?: return Result.failure())
                if (!file.exists()) return Result.failure()
                if (api.uploadVoice(file, callerNumber)) {
                    file.delete(); Result.success()
                } else Result.retry()
            }
            "whatsapp" -> {
                val msg = inputData.getString("message_text") ?: return Result.failure()
                val senderName = inputData.getString("sender_name")
                if (api.uploadWhatsApp(msg, senderName, callerNumber))
                    Result.success() else Result.retry()
            }
            else -> Result.failure()
        }
    }
}
