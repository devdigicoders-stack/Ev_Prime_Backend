require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const Admin = require('./src/models/Admin');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Local Database successfully!\n');

    rl.question('Enter Admin Name: ', (name) => {
      rl.question('Enter Admin Email: ', (email) => {
        rl.question('Enter Admin Password: ', async (password) => {
          try {
            // Check if admin already exists
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
              console.log('\nError: An admin with this email already exists!');
              process.exit(1);
            }

            // Create new admin
            const newAdmin = new Admin({
              name: name,
              email: email,
              password: password,
              role: 'Super Admin'
            });

            await newAdmin.save();
            console.log(`\nSuccess! Admin account created for ${email}.`);
            console.log('You can now use these credentials to login to the local Admin Panel.');
            process.exit(0);
          } catch (err) {
            console.error('\nError creating admin:', err);
            process.exit(1);
          }
        });
      });
    });
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

createAdmin();
