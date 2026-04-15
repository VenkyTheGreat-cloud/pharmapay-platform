package com.pharmapay.delivery.capture

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.File
import java.util.concurrent.TimeUnit

class CaptureApiClient(private val context: Context) {

    private val baseUrl = CapturePrefs.getApiBaseUrl(context)
        .ifEmpty { "https://api.pharmapay.swinkpay-fintech.com" }
    private val token = CapturePrefs.getStoreToken(context)

    private val http = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(120, TimeUnit.SECONDS)  // audio upload over 2G/3G
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    suspend fun uploadVoice(file: File, callerNumber: String?): Boolean =
        withContext(Dispatchers.IO) {
            runCatching {
                val body = MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart("channel", "voice")
                    .addFormDataPart("caller_number", callerNumber ?: "")
                    .addFormDataPart("audio", file.name,
                        file.asRequestBody("audio/mpeg".toMediaType()))
                    .build()
                http.newCall(
                    Request.Builder()
                        .url("$baseUrl/inbound/voice")
                        .header("Authorization", "Bearer $token")
                        .post(body).build()
                ).execute().use { it.isSuccessful }
            }.getOrDefault(false)
        }

    suspend fun uploadWhatsApp(
        message: String, senderName: String?, callerNumber: String?
    ): Boolean = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject().apply {
                put("channel",       "whatsapp")
                put("message",       message)
                put("sender_name",   senderName   ?: JSONObject.NULL)
                put("caller_number", callerNumber  ?: JSONObject.NULL)
            }.toString()
            http.newCall(
                Request.Builder()
                    .url("$baseUrl/inbound/whatsapp")
                    .header("Authorization", "Bearer $token")
                    .post(json.toRequestBody("application/json".toMediaType()))
                    .build()
            ).execute().use { it.isSuccessful }
        }.getOrDefault(false)
    }
}
