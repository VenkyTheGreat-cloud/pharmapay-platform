import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

/**
 * HomeRouter checks the user's role and pharmacy status,
 * then redirects to the appropriate screen.
 *
 * - Pharmacy owner (pending/rejected) → PharmacyConfigure
 * - Pharmacy owner (submitted/approved) → PharmacyStatus
 * - Pharmacy owner (live) → Main (orders/dashboard)
 * - Delivery boy → Main (orders/marketplace)
 */
const HomeRouter = ({ navigation }) => {
    const { user, pharmacyStatus, checkPharmacyStatus } = useAuth();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        route();
    }, []);

    const route = async () => {
        try {
            let status = pharmacyStatus;

            // If admin and status not yet checked, check now
            if (user?.role === 'admin' && (!status || status === null)) {
                status = await checkPharmacyStatus();
            }

            if (user?.role === 'admin' && status && status !== 'none') {
                // Pharmacy owner — route based on status
                if (status === 'pending_approval' || status === 'rejected') {
                    navigation.replace('PharmacyConfigure');
                } else if (status === 'submitted' || status === 'approved' || status === 'building') {
                    navigation.replace('PharmacyStatus');
                } else if (status === 'live') {
                    navigation.replace('Main');
                } else {
                    navigation.replace('PharmacyConfigure');
                }
            } else {
                // Delivery boy or no pharmacy — go to main app
                navigation.replace('Main');
            }
        } catch {
            navigation.replace('Main');
        } finally {
            setChecking(false);
        }
    };

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#20b1aa" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
});

export default HomeRouter;
