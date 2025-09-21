const { User } = require('./models');

async function findUser() {
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email'],
      limit: 5
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} (ID: ${user.id}) - ${user.email}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findUser();
