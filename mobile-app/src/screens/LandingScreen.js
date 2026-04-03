import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LandingScreen = ({ navigation }) => {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Hero Section */}
            <View style={styles.hero}>
                <View style={styles.logoContainer}>
                    <Ionicons name="medical" size={48} color="#fff" />
                </View>
                <Text style={styles.appName}>SwinkPayPharma</Text>
                <Text style={styles.tagline}>
                    India's Pharmacy Delivery Management Platform
                </Text>
                <Text style={styles.subtitle}>
                    Launch your pharmacy delivery app in minutes. Or join as a delivery partner and earn on your schedule.
                </Text>
            </View>

            {/* CTA Buttons */}
            <View style={styles.ctaContainer}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('RoleSelect')}
                >
                    <Ionicons name="rocket-outline" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Get Started</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Ionicons name="log-in-outline" size={20} color="#20b1aa" />
                    <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
                </TouchableOpacity>
            </View>

            {/* Services Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Two Ways to Use SwinkPayPharma</Text>

                {/* Pharmacy Owner Card */}
                <TouchableOpacity
                    style={styles.roleCard}
                    onPress={() => navigation.navigate('RoleSelect')}
                >
                    <View style={[styles.roleIcon, { backgroundColor: '#E0F7F6' }]}>
                        <Ionicons name="storefront-outline" size={32} color="#20b1aa" />
                    </View>
                    <View style={styles.roleContent}>
                        <Text style={styles.roleTitle}>For Pharmacy Owners</Text>
                        <Text style={styles.roleDescription}>
                            Set up your branded pharmacy delivery platform. Get your own admin dashboard, delivery tracking, and payment collection — all in minutes.
                        </Text>
                        <View style={styles.featureList}>
                            <FeatureItem text="White-labelled admin dashboard" />
                            <FeatureItem text="Delivery boy management" />
                            <FeatureItem text="Real-time GPS tracking" />
                            <FeatureItem text="Payment collection & reports" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Delivery Boy Card */}
                <TouchableOpacity
                    style={styles.roleCard}
                    onPress={() => navigation.navigate('RoleSelect')}
                >
                    <View style={[styles.roleIcon, { backgroundColor: '#FFF4E0' }]}>
                        <Ionicons name="bicycle-outline" size={32} color="#F59E0B" />
                    </View>
                    <View style={styles.roleContent}>
                        <Text style={styles.roleTitle}>For Delivery Partners</Text>
                        <Text style={styles.roleDescription}>
                            Register as a gig delivery worker. Browse nearby pharmacies, apply to work, and start earning on your own schedule.
                        </Text>
                        <View style={styles.featureList}>
                            <FeatureItem text="Browse & apply to pharmacies" />
                            <FeatureItem text="Flexible work schedule" />
                            <FeatureItem text="GPS navigation for deliveries" />
                            <FeatureItem text="Track your earnings" />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* How It Works */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>How It Works</Text>

                <View style={styles.stepCard}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Choose Your Role</Text>
                        <Text style={styles.stepDescription}>Pharmacy owner or delivery partner — pick your path</Text>
                    </View>
                </View>

                <View style={styles.stepCard}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Sign Up & Configure</Text>
                        <Text style={styles.stepDescription}>Create your account and set up your preferences</Text>
                    </View>
                </View>

                <View style={styles.stepCard}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Go Live</Text>
                        <Text style={styles.stepDescription}>Start managing deliveries or earning as a delivery partner</Text>
                    </View>
                </View>
            </View>

            {/* Pricing Preview */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Plans for Pharmacy Owners</Text>
                <View style={styles.pricingRow}>
                    <PricingCard title="Starter" price="999" period="/mo" highlight={false} />
                    <PricingCard title="Growth" price="2,499" period="/mo" highlight={true} />
                    <PricingCard title="Enterprise" price="5,999" period="/mo" highlight={false} />
                </View>
                <Text style={styles.pricingNote}>Free for delivery partners</Text>
            </View>

            {/* Footer CTA */}
            <View style={styles.footerCta}>
                <Text style={styles.footerTitle}>Ready to get started?</Text>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('RoleSelect')}
                >
                    <Text style={styles.primaryButtonText}>Sign Up Now</Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Powered by SwinkPay Fintech Pvt Ltd</Text>
                <Text style={styles.footerVersion}>Version 1.0.0</Text>
            </View>
        </ScrollView>
    );
};

const FeatureItem = ({ text }) => (
    <View style={styles.featureItem}>
        <Ionicons name="checkmark-circle" size={16} color="#20b1aa" />
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const PricingCard = ({ title, price, period, highlight }) => (
    <View style={[styles.pricingCard, highlight && styles.pricingCardHighlight]}>
        <Text style={[styles.pricingTitle, highlight && styles.pricingTitleHighlight]}>{title}</Text>
        <Text style={[styles.pricingPrice, highlight && styles.pricingPriceHighlight]}>Rs {price}</Text>
        <Text style={[styles.pricingPeriod, highlight && styles.pricingPeriodHighlight]}>{period}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { paddingBottom: 40 },

    // Hero
    hero: { backgroundColor: '#20b1aa', paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' },
    logoContainer: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    appName: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 8 },
    tagline: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.95)', textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20, maxWidth: 400 },

    // CTA
    ctaContainer: { paddingHorizontal: 24, paddingVertical: 24, gap: 12 },
    primaryButton: { backgroundColor: '#20b1aa', paddingVertical: 18, paddingHorizontal: 32, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' },
    primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    secondaryButton: { borderWidth: 2, borderColor: '#20b1aa', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    secondaryButtonText: { color: '#20b1aa', fontSize: 14, fontWeight: '600' },

    // Sections
    section: { paddingHorizontal: 24, paddingVertical: 24 },
    sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 16, textAlign: 'center' },

    // Role Cards
    roleCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    roleIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    roleContent: {},
    roleTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
    roleDescription: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
    featureList: { gap: 6 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    featureText: { fontSize: 13, color: '#374151' },

    // Steps
    stepCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16, paddingHorizontal: 8 },
    stepNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#20b1aa', alignItems: 'center', justifyContent: 'center' },
    stepNumberText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    stepContent: { flex: 1 },
    stepTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
    stepDescription: { fontSize: 13, color: '#6B7280' },

    // Pricing
    pricingRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    pricingCard: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    pricingCardHighlight: { backgroundColor: '#20b1aa', borderColor: '#20b1aa' },
    pricingTitle: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
    pricingTitleHighlight: { color: 'rgba(255,255,255,0.8)' },
    pricingPrice: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
    pricingPriceHighlight: { color: '#fff' },
    pricingPeriod: { fontSize: 11, color: '#9CA3AF' },
    pricingPeriodHighlight: { color: 'rgba(255,255,255,0.7)' },
    pricingNote: { textAlign: 'center', fontSize: 13, color: '#10B981', marginTop: 12, fontWeight: '500' },

    // Footer CTA
    footerCta: { backgroundColor: '#F0FDFA', paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 16 },
    footerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },

    // Footer
    footer: { paddingVertical: 24, alignItems: 'center', gap: 4 },
    footerText: { fontSize: 12, color: '#9CA3AF' },
    footerVersion: { fontSize: 11, color: '#D1D5DB' },
});

export default LandingScreen;
