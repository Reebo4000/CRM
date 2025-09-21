const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const resetAdminPassword = async () => {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'gemini_crm',
    password: 'Reebo@2004',
    port: 5432,
  });

  try {
    // Hash the original password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update the admin user password
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, 'admin@geminicrm.com']
    );
    
    console.log('✅ Admin password reset to: admin123');
    console.log(`   Updated ${result.rowCount} user(s)`);
    
    // Also reset the name back to original
    await pool.query(
      'UPDATE users SET "firstName" = $1, "lastName" = $2 WHERE email = $3',
      ['Admin', 'User', 'admin@geminicrm.com']
    );
    
    console.log('✅ Admin profile reset to: Admin User');
    
  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
  } finally {
    await pool.end();
  }
};

resetAdminPassword();
