const db = require('./config/database');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupAdmin() {
  try {
    console.log('Setting up admin user...');
    
    // Admin credentials
    const adminData = {
      admin_id: 10101,
      username: 'admin1',
      email: 'yogeshwaran.ps2023@vitstudent.ac.in',
      password: '#narawhsegoY05'
    };

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    console.log('Password hashed successfully');

    // Check if admin already exists
    const [existingAdmin] = await db.query(
      'SELECT admin_id FROM admin WHERE email = ? OR username = ?',
      [adminData.email, adminData.username]
    );

    if (existingAdmin && existingAdmin.length > 0) {
      console.log('Admin user already exists. Updating password...');
      await db.query(
        'UPDATE admin SET password_hash = ? WHERE email = ? OR username = ?',
        [hashedPassword, adminData.email, adminData.username]
      );
      console.log('✅ Admin password updated successfully');
    } else {
      console.log('Creating new admin user...');
      await db.query(
        'INSERT INTO admin (admin_id, username, email, password_hash) VALUES (?, ?, ?, ?)',
        [adminData.admin_id, adminData.username, adminData.email, hashedPassword]
      );
      console.log('✅ Admin user created successfully');
    }

    console.log('\n📋 Admin Credentials:');
    console.log('   Admin ID: ' + adminData.admin_id);
    console.log('   Username: ' + adminData.username);
    console.log('   Email: ' + adminData.email);
    console.log('   Password: ' + adminData.password);
    console.log('\n✅ Setup complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();
