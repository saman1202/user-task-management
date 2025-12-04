// config/database.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/user_login_system');
    console.log('✅ MongoDB Connected:', conn.connection.host);
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export default connectDB;
