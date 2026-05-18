package com.pharmapay.delivery.capture

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.ListenableWorker
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
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

    override suspend fun doWork(): ListenableWorker.Result {
        val channel      = inputData.getString("channel")      ?: return ListenableWorker.Result.failure()
        val callerNumber = inputData.getString("caller_number")
        val api          = CaptureApiClient(applicationContext)

        return when (channel) {
            "voice" -> {
                val audioPath = inputData.getString("audio_path")
                    ?: return ListenableWorker.Result.failure()
                val file = File(audioPath)
                if (!file.exists()) return ListenableWorker.Result.failure()
                if (api.uploadVoice(file, callerNumber)) {
                    file.delete()
                    ListenableWorker.Result.success()
                } else {
                    ListenableWorker.Result.retry()
                }
            }
            "whatsapp" -> {
                val msg = inputData.getString("message_text")
                    ?: return ListenableWorker.Result.failure()
                val senderName = inputData.getString("sender_name")
                if (api.uploadWhatsApp(msg, senderName, callerNumber)) {
                    ListenableWorker.Result.success()
                } else {
                    ListenableWorker.Result.retry()
                }
            }
            else -> ListenableWorker.Result.failure()
        }
    }
}
