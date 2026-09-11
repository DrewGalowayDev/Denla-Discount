/**
 * M-Pesa Access Token Test Script
 * Tests M-Pesa credentials and OAuth token generation
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

async function testMpesaCredentials() {
    console.log('\n🧪 Testing M-Pesa Credentials...\n');
    
    // Debug: Show what was loaded
    console.log('🔍 Debug - Loaded from .env:');
    console.log(`MPESA_CONSUMER_KEY exists: ${!!process.env.MPESA_CONSUMER_KEY}`);
    console.log(`MPESA_CONSUMER_KEY value: "${process.env.MPESA_CONSUMER_KEY}"`);
    console.log(`MPESA_CONSUMER_SECRET exists: ${!!process.env.MPESA_CONSUMER_SECRET}\n`);
    
    // Check if credentials are set
    if (!process.env.MPESA_CONSUMER_KEY || 
        process.env.MPESA_CONSUMER_KEY.trim() === '' ||
        process.env.MPESA_CONSUMER_KEY.includes('your_consumer_key')) {
        console.log('❌ ERROR: MPESA_CONSUMER_KEY is not set or is placeholder');
        console.log('📝 Please update your .env file with real credentials');
        return;
    }

    if (!process.env.MPESA_CONSUMER_SECRET || 
        process.env.MPESA_CONSUMER_SECRET.trim() === '' ||
        process.env.MPESA_CONSUMER_SECRET.includes('your_consumer_secret')) {
        console.log('❌ ERROR: MPESA_CONSUMER_SECRET is not set or is placeholder');
        console.log('📝 Please update your .env file with real credentials');
        return;
    }

    console.log('📋 Configuration:');
    console.log('─────────────────────────────────────');
    console.log(`Environment: ${process.env.MPESA_ENVIRONMENT}`);
    console.log(`Shortcode: ${process.env.MPESA_SHORTCODE}`);
    console.log(`Consumer Key: ${process.env.MPESA_CONSUMER_KEY.substring(0, 15)}...`);
    console.log(`Consumer Secret: ${process.env.MPESA_CONSUMER_SECRET.substring(0, 15)}...`);
    console.log(`Passkey: ${process.env.MPESA_PASSKEY?.substring(0, 15)}...`);
    console.log('─────────────────────────────────────\n');

    // Determine base URL
    const baseURL = process.env.MPESA_ENVIRONMENT === 'production'
        ? process.env.MPESA_BASE_URL_PRODUCTION
        : process.env.MPESA_BASE_URL_SANDBOX;

    console.log(`🌐 Testing against: ${baseURL}\n`);

    try {
        // Generate Basic Auth
        const auth = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString('base64');

        console.log('🔐 Requesting OAuth token...');

        // Make request
        const response = await axios.get(
            `${baseURL}/oauth/v1/generate?grant_type=client_credentials`,
            {
                headers: {
                    'Authorization': `Basic ${auth}`
                },
                timeout: 10000 // 10 second timeout
            }
        );

        console.log('\n✅ SUCCESS! Access Token Retrieved\n');
        console.log('📊 Response:');
        console.log('─────────────────────────────────────');
        console.log(`Access Token: ${response.data.access_token?.substring(0, 20)}...`);
        console.log(`Expires In: ${response.data.expires_in} seconds`);
        console.log('─────────────────────────────────────\n');

        console.log('🎉 Your M-Pesa credentials are working correctly!');
        console.log('✅ You can now use the M-Pesa API\n');

        return true;

    } catch (error) {
        console.log('\n❌ FAILED to get access token\n');
        
        if (error.response) {
            console.log('📋 Error Details:');
            console.log('─────────────────────────────────────');
            console.log(`Status: ${error.response.status}`);
            console.log(`Status Text: ${error.response.statusText}`);
            console.log(`Error Code: ${error.response.data?.errorCode || 'N/A'}`);
            console.log(`Error Message: ${error.response.data?.errorMessage || error.response.data?.error_description || 'N/A'}`);
            console.log('─────────────────────────────────────\n');

            // Specific error handling
            if (error.response.status === 401) {
                console.log('🔍 Diagnosis: Invalid Credentials');
                console.log('\n📝 Possible Solutions:');
                console.log('1. Check your Consumer Key and Consumer Secret in .env');
                console.log('2. Make sure credentials match your Safaricom app');
                console.log('3. Verify you\'re using sandbox credentials for sandbox environment');
                console.log('4. Try regenerating credentials in Daraja Portal');
            } else if (error.response.status === 400) {
                console.log('🔍 Diagnosis: Bad Request');
                console.log('\n📝 Check that grant_type is correct');
            } else if (error.response.status >= 500) {
                console.log('🔍 Diagnosis: Safaricom Server Error');
                console.log('\n📝 Try again in a few minutes - might be temporary');
            }
        } else if (error.request) {
            console.log('🔍 Diagnosis: Network Error');
            console.log('\n📝 Possible Solutions:');
            console.log('1. Check your internet connection');
            console.log('2. Verify Safaricom servers are accessible');
            console.log('3. Check if firewall is blocking requests');
            console.log(`4. Verify base URL: ${baseURL}`);
        } else {
            console.log('🔍 Error:', error.message);
        }

        console.log('\n📚 Need Help?');
        console.log('─────────────────────────────────────');
        console.log('1. Get credentials: https://developer.safaricom.co.ke/');
        console.log('2. Documentation: https://developer.safaricom.co.ke/Documentation');
        console.log('3. Support: apisupport@safaricom.co.ke');
        console.log('─────────────────────────────────────\n');

        return false;
    }
}

// Run test
testMpesaCredentials()
    .then(success => {
        if (!success) {
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
