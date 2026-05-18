package com.pharmapay.delivery.capture

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class WhatsAppNotificationListener : NotificationListenerService() {

    companion object {
        private val WA_PACKAGES = setOf("com.whatsapp", "com.whatsapp.w4b")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName !in WA_PACKAGES) return

        val extras  = sbn.notification.extras
        val title   = extras.getString(Notification.EXTRA_TITLE) ?: return
        val message = extras.getCharSequence(Notification.EXTRA_TEXT)
            ?.toString()?.trim() ?: return

        if (message.length < 4) return

        // Skip group chats — they post as "GroupName" title with "Sender: text" message
        if (message.contains(": ") && title.none { it.isDigit() }) return

        // Skip media stubs
        if (message.startsWith("\uD83D\uDCF7") || message.startsWith("\uD83D\uDCF9") ||
            message.startsWith("\uD83C\uDFA4") || message.startsWith("\uD83D\uDCCD") ||
            message.lowercase() in listOf("image", "video", "audio", "document", "location"))
            return

        // WhatsApp Business shows unsaved numbers as title: "+91 98765 43210"
        val mobileFromTitle = title
            .replace(Regex("[^0-9]"), "")
            .takeLast(10)
            .takeIf { it.length == 10 }

        val senderName = title.takeUnless { it.matches(Regex("[0-9 +\\-()]+")) }

        CaptureUploadWorker.enqueue(
            context      = this,
            messageText  = message,
            senderName   = senderName,
            callerNumber = mobileFromTitle,
            channel      = "whatsapp"
        )
    }
}
