import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.subtitle}>PharmaGig</Text>

      <View style={styles.section}>
        <Text style={styles.heading}>Applicability</Text>
        <Text style={styles.body}>
          This Policy is applicable to PharmaGig and its subscribers who have subscribed to PharmaGig service.
        </Text>
        <Text style={styles.body}>
          Consequently, to the extent of this Privacy Policy, the word "we", "us", "PharmaGig" represents PharmaGig and its subscribers as stated above.
        </Text>
        <Text style={styles.body}>
          The word "you" means any individual and/or employees of entities which share their personal data as described in the section titled "Personal Information".
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.body}>
          We, PharmaGig are located at BOOTSTART COWORKING, 3rd Floor, Sanjay Nagar Main Rd, MET Layout, Ashwath Nagar, R.M.V. 2nd Stage, Bengaluru, Karnataka 560094 are herein referred to as PharmaGig. At PharmaGig, we value your trust & respect your privacy. This Privacy Policy provides you with the details about the manner in which your data is collected, stored & used by us. You are advised to read this Privacy Policy carefully. By accessing PharmaGig and/or downloading and using the PharmaGig application you willingly give us consent to use & disclose your personal information in accordance with this Privacy Policy. If you do not agree to the terms of the policy, please do not use or access PharmaGig.
        </Text>
        <Text style={styles.body}>
          Note: Our privacy policy may change at any time without prior notification. To make sure that you are aware of any changes, kindly review the policy periodically. This privacy policy shall apply uniformly to PharmaGig applications.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>General</Text>
        <Text style={styles.body}>
          We will not sell, share, or rent your personal information to any 3rd party or use your email address/mobile number for any unsolicited emails and/or SMS. Any emails and/or SMS sent by PharmaGig will only be in connection with the provision of agreed services & products and this Privacy Policy. Periodically, we may reveal general statistical information about PharmaGig and its users, such as number of visitors, number and type of goods and services purchased etc. We reserve the right to communicate your personal information to any third party that makes a legally compliant request for its disclosure.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Personal Information</Text>
        <Text style={styles.body}>
          Personal information means and includes all information that can be linked to specific individual or to identify any individual, such as name, address, mailing address, telephone number, email ID, credit card number, cardholder name, card expiration date, information about your mobile phone, Aadhaar number, Smart Tags and any details that may have been voluntarily provided by the user in connection with availing any of the services of PharmaGig. When you browse through PharmaGig, we may collect information regarding the mobile/tab devices details, domain, and host from which you access the internet, Internet Protocol (IP) address of the computer or Internet Service Provider (ISP) you are using and anonymous site statistical data.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Use of Personal Information</Text>
        <Text style={styles.body}>
          We use personal information to provide you with the services & products you explicitly requested for, to resolve disputes, troubleshoot concerns, help promote safe services, collect money, measure consumer interest in our services, inform you about offers, products, services, updates, customize your experience, detect & protect us against error, fraud and other criminal activity, enforce our terms and conditions etc. We also use your contact information to send you offers based on your previous transactions and interests. We may occasionally ask you to complete optional information and demographic information (like zip code, age, gender, etc.). We use this data to customize your experience at PharmaGig, providing you with content that we think you might be interested in and to display content according to your preferences.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Security</Text>
        <Text style={styles.body}>
          PharmaGig has stringent security measures in place to protect the loss, misuse, and alteration of the information under our control. Whenever you change or access your account information, we offer the use of a secure server. Once your information is in our possession we adhere to strict security guidelines, protecting it against unauthorized access. None of your personal information namely credit card number, expiry date etc. is stored in PharmaGig or in our servers as a clear text but only as an encrypted data that cannot be accessed or read by any individual or application.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Consent</Text>
        <Text style={styles.body}>
          By using PharmaGig and/or by providing your information, you consent to the collection and use of the information you disclose on PharmaGig in accordance with this privacy policy, including but not limited to your consent for sharing your information as per this privacy policy.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by PharmaGig</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#20b1aa', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  section: { marginBottom: 24 },
  heading: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  body: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 8 },
  footer: { paddingVertical: 24, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#9CA3AF' },
});

export default PrivacyPolicyScreen;
