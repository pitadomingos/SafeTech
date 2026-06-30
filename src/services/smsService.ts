
import { logger } from '../utils/logger';

// Mock SMS Gateway Service
export const sendSms = async (phoneNumber: string, message: string): Promise<boolean> => {
    // In a real application, this would call an API like Twilio, AWS SNS, or a local GSM gateway.
    // e.g., await fetch('https://api.twilio.com/...', { method: 'POST', body: ... })
    
    return new Promise((resolve) => {
        setTimeout(() => {
            if (!phoneNumber) {
                logger.warn(`SMS Failed: No phone number provided for message: "${message}"`);
                resolve(false);
                return;
            }

            // Simulate Network Request
            console.log(`%c[SMS GATEWAY] Sending to ${phoneNumber}:`, 'color: #10b981; font-weight: bold;');
            console.log(`%c"${message}"`, 'color: #10b981; font-style: italic;');
            
            logger.info(`SMS Sent to ${phoneNumber}`, { message });
            resolve(true);
        }, 300); // Simulate network latency
    });
};

export const formatPhoneNumber = (input: string): string => {
    // Basic sanitizer for Mozambique/International format
    // Removes non-digits
    return input.replace(/\D/g, '');
};
