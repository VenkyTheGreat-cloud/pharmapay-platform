import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TermsScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.subtitle}>SwinkPayPharma</Text>

      <View style={styles.section}>
        <Text style={styles.body}>
          These Terms and Conditions, along with privacy policy or other terms ("Terms") constitute a binding agreement by and between SWINKPAY PHARMA, ("Website Owner" or "we" or "us" or "our") and you ("you" or "your") and relate to your use of our website, goods (as applicable) or services (as applicable) (collectively, "Services").
        </Text>
        <Text style={styles.body}>
          By using our website, application and/or availing the Services, you agree that you have read and accepted these Terms (including the Privacy Policy). We reserve the right to modify these Terms at any time and without assigning any reason. It is your responsibility to periodically review these Terms to stay informed of updates.
        </Text>
        <Text style={styles.body}>
          The use of this website, application and/or availing of our Services is subject to the following terms of use:
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Terms of Use</Text>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>1.</Text>
          <Text style={styles.bulletText}>To access and use the Services, you agree to provide true, accurate and complete information to us during and after registration, and you shall be responsible for all acts done through the use of your registered account.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>2.</Text>
          <Text style={styles.bulletText}>Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials offered on this website or through the Services, for any specific purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>3.</Text>
          <Text style={styles.bulletText}>Your use of our Services and the website is solely at your own risk and discretion. You are required to independently assess and ensure that the Services meet your requirements.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>4.</Text>
          <Text style={styles.bulletText}>The contents of the Website, application and the Services are proprietary to Us and you will not have any authority to claim any intellectual property rights, title, or interest in its contents.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>5.</Text>
          <Text style={styles.bulletText}>You acknowledge that unauthorized use of the Website or the Services may lead to action against you as per these Terms or applicable laws.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>6.</Text>
          <Text style={styles.bulletText}>You agree to pay us the charges associated with availing the Services.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>7.</Text>
          <Text style={styles.bulletText}>You agree not to use the website and/or Services for any purpose that is unlawful, illegal or forbidden by these Terms, or Indian or local laws that might apply to you.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>8.</Text>
          <Text style={styles.bulletText}>You agree and acknowledge that website, application and the Services may contain links to other third party websites. On accessing these links, you will be governed by the terms of use, privacy policy and such other policies of such third party websites.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>9.</Text>
          <Text style={styles.bulletText}>You understand that upon initiating a transaction for availing the Services you are entering into a legally binding and enforceable contract with us for the Services.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>10.</Text>
          <Text style={styles.bulletText}>You shall be entitled to claim a refund of the payment made by you in case we are not able to provide the Service. The timelines for such return and refund will be according to the specific Service you have availed or within the time period provided in our policies (as applicable). In case you do not raise a refund claim within the stipulated time, then this would make you ineligible for a refund.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>11.</Text>
          <Text style={styles.bulletText}>Notwithstanding anything contained in these Terms, the parties shall not be liable for any failure to perform an obligation under these Terms if performance is prevented or delayed by a force majeure event.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>12.</Text>
          <Text style={styles.bulletText}>These Terms and any dispute or claim relating to it, or its enforceability, shall be governed by and construed in accordance with the laws of India.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>13.</Text>
          <Text style={styles.bulletText}>All disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>14.</Text>
          <Text style={styles.bulletText}>All concerns or communications relating to these Terms must be communicated to us using the contact information provided on this website.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Deficient Services</Text>
        <Text style={styles.body}>
          Any deficiency in service and/or performance is to be reported to SwinkPay Pharma. Service credit, if any:
        </Text>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.bulletText}>Shall be at the sole discretion of SwinkPay Pharma.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.bulletText}>Communicated within 15 business days.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.bulletText}>Can be used to access the platform for additional days as decided by SwinkPay Pharma.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.bulletText}>Shall not have full or partial refund of subscription and/or any other charges.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Subscription Cancellation</Text>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.bulletText}>Subscription cannot be cancelled and/or downgraded to a lower package once the payment is initiated. Consequently, there is no option for refund of the subscription cost and any other cost.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.bulletText}>Upgrade to a higher value package can be requested to SwinkPay Pharma and approval of such request is at the sole discretion of SwinkPay Pharma.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by SwinkPay Fintech Pvt Ltd</Text>
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
  bulletItem: { flexDirection: 'row', marginBottom: 10, paddingRight: 8 },
  bullet: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginRight: 8, minWidth: 20 },
  bulletText: { fontSize: 14, color: '#374151', lineHeight: 22, flex: 1 },
  footer: { paddingVertical: 24, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#9CA3AF' },
});

export default TermsScreen;
