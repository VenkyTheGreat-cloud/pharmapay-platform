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
        // Safety timeout — if routing takes too long, go to Main
        const timeout = setTimeout(() => {
            console.warn('HomeRouter: routing timeout, falling back to Main');
            navigation.replace('Main');
        }, 8000);

        route().finally(() => clearTimeout(timeout));
    }, []);

    const route = async () => {
        try {
            // Non-admin users go straight to main app
            if (user?.role !== 'admin') {
                navigation.replace('Main');
                return;
            }

            // Admin users — check pharmacy status with timeout
            let status = 'none';
            try {
                const statusPromise = checkPharmacyStatus();
                const timeoutPromise = new Promise((resolve) =>
                    setTimeout(() => resolve('none'), 5000)
                );
                status = await Promise.race([statusPromise, timeoutPromise]);
            } catch {
                status = 'none';
            }

            if (status && status !== 'none') {
                if (status === 'pending_approval' || status === 'rejected') {
                    navigation.replace('PharmacyConfigure');
                } else if (status === 'submitted' || status === 'approved' || status === 'building') {
                    navigation.replace('PharmacyStatus');
                } else if (status === 'live') {
                    navigation.replace('PharmacyStatus');
                } else {
                    navigation.replace('PharmacyConfigure');
                }
            } else {
                navigation.replace('AdminPanel');
            }
        } catch {
            navigation.replace('Main');
        } finally {
            setChecking(false);
        }
    };

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#139900" />
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
