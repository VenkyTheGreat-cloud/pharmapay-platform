import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PHARMACY_IMG = 'https://images.unsplash.com/photo-1681418290255-a5355089dc6d?w=600&q=80';
const DELIVERY_IMG = 'https://images.unsplash.com/photo-1750635409988-a913186eecf4?w=600&q=80';
const isWeb = Platform.OS === 'web';

const LandingScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isWide = width > 768;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Navbar — web only */}
            {isWeb && (
                <View style={[styles.navbar, isWide && styles.navbarWide]}>
                    <TouchableOpacity style={styles.navLogo}>
                        <View style={styles.navLogoIcon}>
                            <Ionicons name="storefront" size={18} color="#fff" />
                        </View>
                        <Text style={styles.navLogoText}>Pharma<Text style={{ color: '#10B981' }}>Gig</Text></Text>
                    </TouchableOpacity>
                    <View style={styles.navLinks}>
                        {[{ screen: 'Landing', label: 'Home' }, { screen: 'Features', label: 'Features' }, { screen: 'HowItWorks', label: 'How It Works' }, { screen: 'Pricing', label: 'Pricing' }].map((s) => (
                            <TouchableOpacity key={s.screen} onPress={() => navigation.navigate(s.screen)}>
                                <Text style={[styles.navLinkText, s.screen === 'Landing' && { color: '#10B981', fontWeight: '700' }]}>{s.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.navAuth}>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.navLoginText}>Log in</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navGetStartedBtn} onPress={() => navigation.navigate('PharmacySignup')}>
                            <Text style={styles.navGetStartedText}>Get Started</Text>
                            <Ionicons name="arrow-forward" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Mobile-only compact header */}
            {!isWeb && (
                <View style={styles.mobileHeader}>
                    <View style={styles.mobileHeaderTop}>
                        <View style={styles.mobileLogoRow}>
                            <View style={styles.mobileLogoIcon}>
                                <Ionicons name="storefront" size={16} color="#fff" />
                            </View>
                            <Text style={styles.mobileLogoText}>Pharma<Text style={{ color: '#10B981' }}>Gig</Text></Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.mobileLoginText}>Log in</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobilePillRow}>
                        {[
                            { label: 'Features', screen: 'Features' },
                            { label: 'How It Works', screen: 'HowItWorks' },
                            { label: 'Pricing', screen: 'Pricing' },
                        ].map((item) => (
                            <TouchableOpacity key={item.screen} style={styles.mobilePill} onPress={() => navigation.navigate(item.screen)}>
                                <Text style={styles.mobilePillText}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Hero Section */}
            <View style={[styles.hero, isWide && styles.heroWide]}>
                <View style={[isWide && { flex: 1, paddingRight: 32 }]}>
                    {/* Badge */}
                    <View style={styles.badge}>
                        <View style={styles.badgeDot} />
                        <Text style={styles.badgeText}>India's #1 Pharmacy Delivery Network</Text>
                    </View>

                    <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
                        Scale your <Text style={{ color: '#10B981' }}>pharmacy</Text>.
                        {'\n'}Empower your <Text style={{ color: '#3B82F6' }}>deliveries</Text>.
                    </Text>
                    <Text style={[styles.heroDesc, isWide && { maxWidth: 500 }]}>
                        PharmaGig connects independent Indian pharmacies with reliable delivery partners. Launch your own white-labeled delivery platform or join as a partner for flexible earning.
                    </Text>

                    {/* CTA Buttons */}
                    <View style={[styles.ctaContainer, isWide && styles.ctaContainerWide]}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('PharmacySignup')} activeOpacity={0.8}>
                            <Text style={styles.primaryButtonText}>Start as Pharmacy Owner</Text>
                            <Ionicons name="storefront" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={async () => {
                            await AsyncStorage.setItem('pharma_user_role', 'delivery_boy');
                            navigation.navigate('Register');
                        }} activeOpacity={0.8}>
                            <Text style={styles.secondaryButtonText}>Join as Delivery Partner</Text>
                            <Ionicons name="bicycle" size={16} color="#334155" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hero Visual */}
                <View style={[styles.heroVisual, isWide && { flex: 1 }]}>
                    <View style={styles.heroImageRow}>
                        <View style={[styles.heroImageCard, { overflow: 'hidden' }]}>
                            <Image source={{ uri: PHARMACY_IMG }} style={styles.heroImg} />
                            <View style={styles.heroImageOverlay}>
                                <Text style={styles.heroImageLabel}>For Pharmacies</Text>
                            </View>
                        </View>
                        <View style={[styles.heroImageCard, { overflow: 'hidden' }]}>
                            <Image source={{ uri: DELIVERY_IMG }} style={styles.heroImg} />
                            <View style={styles.heroImageOverlay}>
                                <Text style={styles.heroImageLabel}>For Delivery Partners</Text>
                            </View>
                        </View>
                    </View>
                    {/* Floating Badges */}
                    <View style={[styles.floatingBadge, { left: -8, top: 10 }]}>
                        <View style={[styles.floatingIcon, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.floatingLabel}>Verified Delivery</Text>
                            <Text style={styles.floatingValue}>100% Safe</Text>
                        </View>
                    </View>
                    <View style={[styles.floatingBadge, { right: -8, bottom: 10 }]}>
                        <View style={[styles.floatingIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="time" size={16} color="#3B82F6" />
                        </View>
                        <View>
                            <Text style={styles.floatingLabel}>Avg. Delivery</Text>
                            <Text style={styles.floatingValue}>18 Mins</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Two-sided marketplace */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>A platform designed for both sides</Text>
                <Text style={styles.sectionDesc}>Whether you own a pharmacy or deliver medicines, we've got you covered.</Text>

                <View style={isWide ? styles.roleCardsRow : undefined}>
                    <View style={[styles.roleCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }, isWide && { flex: 1 }]}>
                        <View style={[styles.roleIcon, { backgroundColor: '#fff', borderColor: '#A7F3D0' }]}>
                            <Ionicons name="storefront-outline" size={28} color="#10B981" />
                        </View>
                        <Text style={styles.roleTitle}>Pharmacy Owners</Text>
                        <View style={styles.featureList}>
                            <FeatureItem icon="shield-checkmark" color="#10B981" text="Launch your own white-labeled delivery platform" />
                            <FeatureItem icon="navigate" color="#10B981" text="Real-time GPS tracking of delivery partners" />
                            <FeatureItem icon="receipt" color="#10B981" text="Automated settlements, invoicing & reporting" />
                        </View>
                        <TouchableOpacity style={styles.roleLink} onPress={() => navigation.navigate('PharmacySignup')}>
                            <Text style={[styles.roleLinkText, { color: '#059669' }]}>Get Started</Text>
                            <Ionicons name="arrow-forward" size={16} color="#059669" />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.roleCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }, isWide && { flex: 1 }]}>
                        <View style={[styles.roleIcon, { backgroundColor: '#fff', borderColor: '#BFDBFE' }]}>
                            <Ionicons name="bicycle-outline" size={28} color="#3B82F6" />
                        </View>
                        <Text style={styles.roleTitle}>Delivery Partners</Text>
                        <View style={styles.featureList}>
                            <FeatureItem icon="time" color="#3B82F6" text="Flexible work hours. Be your own boss" />
                            <FeatureItem icon="map" color="#3B82F6" text="In-app GPS navigation for fast delivery" />
                            <FeatureItem icon="wallet" color="#3B82F6" text="Transparent earnings & weekly payouts" />
                        </View>
                        <TouchableOpacity style={styles.roleLink} onPress={async () => {
                            await AsyncStorage.setItem('pharma_user_role', 'delivery_boy');
                            navigation.navigate('Register');
                        }}>
                            <Text style={[styles.roleLinkText, { color: '#2563EB' }]}>Join Now</Text>
                            <Ionicons name="arrow-forward" size={16} color="#2563EB" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* CTA Section */}
            <View style={styles.ctaSection}>
                <Text style={styles.ctaSectionTitle}>Ready to transform your delivery operations?</Text>
                <TouchableOpacity style={styles.ctaSectionBtn} onPress={() => navigation.navigate('PharmacySignup')} activeOpacity={0.8}>
                    <Text style={styles.ctaSectionBtnText}>Get Started Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
                    <Ionicons name="log-in-outline" size={18} color="#20b1aa" />
                    <Text style={styles.loginBtnText}>Already have an account? Login</Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerLinks}>
                    <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                        <Text style={styles.footerLink}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerDivider}>|</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                        <Text style={styles.footerLink}>Terms & Conditions</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.footerText}>Powered by SwinkPay Fintech Pvt Ltd</Text>
                <Text style={styles.footerVersion}>Version 1.0.0</Text>
            </View>
        </ScrollView>
    );
};

const FeatureItem = ({ icon, color, text }) => (
    <View style={styles.featureItem}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const StepCard = ({ number, title, description, color, icon }) => (
    <View style={styles.stepCard}>
        <View style={[styles.stepIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.stepContent}>
            <View style={[styles.stepNumber, { backgroundColor: '#E2E8F0' }]}>
                <Text style={styles.stepNumberText}>{number}</Text>
            </View>
            <Text style={styles.stepTitle}>{title}</Text>
            <Text style={styles.stepDescription}>{description}</Text>
        </View>
    </View>
);

const PricingCard = ({ title, price, highlight }) => (
    <View style={[styles.pricingCard, highlight && styles.pricingCardHighlight]}>
        {highlight && <Text style={styles.popularBadge}>Popular</Text>}
        <Text style={[styles.pricingTitle, highlight && styles.pricingTitleHighlight]}>{title}</Text>
        <Text style={[styles.pricingPrice, highlight && styles.pricingPriceHighlight]}>Rs {price}</Text>
        <Text style={[styles.pricingPeriod, highlight && styles.pricingPeriodHighlight]}>/month</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { paddingBottom: 20 },

    // Web Navbar
    navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', ...(isWeb ? { position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)' } : {}) },
    navbarWide: { paddingHorizontal: 48 },
    navLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    navLogoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    navLogoText: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    navLinks: { flexDirection: 'row', gap: 28 },
    navLinkText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
    navAuth: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    navLoginText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
    navGetStartedBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    navGetStartedText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Hero
    hero: { backgroundColor: '#F1F5F9', paddingTop: 24, paddingBottom: 36, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    heroWide: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 48, paddingTop: 80, paddingBottom: 60 },

    // Mobile compact header
    mobileHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: 48 },
    mobileHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
    mobileLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    mobileLogoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    mobileLogoText: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
    mobileLoginText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
    mobilePillRow: { paddingHorizontal: 12, paddingBottom: 10, gap: 6 },
    mobilePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9' },
    mobilePillText: { fontSize: 13, fontWeight: '500', color: '#64748B' },

    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16, gap: 6, alignSelf: 'flex-start' },
    badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    badgeText: { fontSize: 12, fontWeight: '600', color: '#065F46' },

    heroTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', lineHeight: 36, marginBottom: 12, letterSpacing: -0.5 },
    heroTitleWide: { fontSize: 42, lineHeight: 52 },
    heroDesc: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 24 },

    // Hero Visual
    heroVisual: { width: '100%', marginTop: 28, position: 'relative' },
    heroImageRow: { flexDirection: 'row', borderRadius: 20, overflow: 'hidden', height: 220, borderWidth: 1, borderColor: '#E2E8F0' },
    heroImageCard: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    heroImg: { width: '100%', height: '100%', position: 'absolute' },
    heroImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(15,23,42,0.6)' },
    heroImageLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
    floatingBadge: { position: 'absolute', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    floatingIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    floatingLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
    floatingValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },

    // CTA
    ctaContainer: { width: '100%', gap: 12 },
    ctaContainerWide: { flexDirection: 'row', gap: 16 },
    primaryButton: { backgroundColor: '#10B981', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    secondaryButton: { borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    secondaryButtonText: { color: '#334155', fontSize: 15, fontWeight: '600' },


    // Sections
    section: { paddingHorizontal: 24, paddingVertical: 32 },
    sectionTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
    sectionDesc: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 22 },

    // Role Cards
    roleCardsRow: { flexDirection: 'row', gap: 16 },
    roleCard: { borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1 },
    roleIcon: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    roleTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
    featureList: { gap: 12, marginBottom: 16 },
    featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    featureText: { fontSize: 14, color: '#334155', flex: 1, lineHeight: 20 },
    roleLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    roleLinkText: { fontSize: 15, fontWeight: '700' },

    // Steps
    stepCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20, paddingHorizontal: 4 },
    stepIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    stepContent: { flex: 1 },
    stepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    stepNumberText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
    stepTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
    stepDescription: { fontSize: 13, color: '#64748B', lineHeight: 18 },

    // Pricing
    pricingRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    pricingCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    pricingCardHighlight: { backgroundColor: '#10B981', borderColor: '#10B981', transform: [{ scale: 1.03 }] },
    popularBadge: { fontSize: 9, fontWeight: '800', color: '#fff', backgroundColor: '#059669', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginBottom: 4, overflow: 'hidden' },
    pricingTitle: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 },
    pricingTitleHighlight: { color: 'rgba(255,255,255,0.8)' },
    pricingPrice: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    pricingPriceHighlight: { color: '#fff' },
    pricingPeriod: { fontSize: 11, color: '#94A3B8' },
    pricingPeriodHighlight: { color: 'rgba(255,255,255,0.7)' },
    setupFeeBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, alignSelf: 'center', borderWidth: 1, borderColor: '#A7F3D0' },
    setupFeeText: { fontSize: 13, color: '#065F46', fontWeight: '600' },
    freeBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
    freeText: { fontSize: 13, color: '#1E40AF', fontWeight: '600' },

    // CTA Section
    ctaSection: { backgroundColor: '#0F172A', paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center' },
    ctaSectionTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 20, lineHeight: 30 },
    ctaSectionBtn: { backgroundColor: '#10B981', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, marginBottom: 16, width: '100%', maxWidth: 400, alignItems: 'center' },
    ctaSectionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    loginBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, width: '100%', maxWidth: 400, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    loginBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    // Footer
    footer: { paddingVertical: 24, alignItems: 'center', gap: 8 },
    footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
    footerLink: { fontSize: 13, color: '#20b1aa', fontWeight: '600' },
    footerDivider: { fontSize: 13, color: '#D1D5DB' },
    footerText: { fontSize: 12, color: '#94A3B8' },
    footerVersion: { fontSize: 11, color: '#D1D5DB' },
});

export default LandingScreen;
