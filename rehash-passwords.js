/**
 * Password Rehash Script
 * This script rehashes all passwords in the users table to bcrypt format
 * 
 * Usage:
 * 1. Set your environment variables in .env
 * 2. Run: node rehash-passwords.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function rehashPasswords() {
  try {
    console.log('🔄 Fetching all users...');
    
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, username, password');

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('ℹ️  No users found in database');
      return;
    }

    console.log(`📊 Found ${users.length} user(s)`);

    for (const user of users) {
      // Check if password is already bcrypt format
      const isBcrypt = user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$');
      
      if (isBcrypt) {
        console.log(`✅ ${user.email} - Password already in bcrypt format, skipping`);
        continue;
      }

      if (!user.password) {
        console.log(`⚠️  ${user.email} - No password set, skipping`);
        continue;
      }

      console.log(`🔐 ${user.email} - Rehashing password...`);
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);

      // Update the user
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ ${user.email} - Error updating: ${updateError.message}`);
      } else {
        console.log(`✅ ${user.email} - Password rehashed successfully`);
      }
    }

    console.log('\n✅ Password rehashing complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

rehashPasswords();
