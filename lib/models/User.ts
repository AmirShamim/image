import mongoose, { Schema, Document, Model } from 'mongoose';

// ...existing code...

// Admin emails - add your email here
const ADMIN_EMAILS = ['your-email@example.com']; // Replace with your actual email

UserSchema.pre('save', function(next) {
  // Automatically assign admin role to specific emails
  if (ADMIN_EMAILS.includes(this.email.toLowerCase())) {
    this.role = 'admin';
  }
  next();
});

// Method to check if user is admin
UserSchema.methods.isAdmin = function(): boolean {
  return this.role === 'admin';
};

// Method to check if user is premium
UserSchema.methods.isPremium = function(): boolean {
  return this.role === 'premium' || this.role === 'admin';
};

// Static method to get user with role check
UserSchema.statics.findByEmailWithRole = async function(email: string) {
  const user = await this.findOne({ email: email.toLowerCase() });
  if (user && ADMIN_EMAILS.includes(email.toLowerCase()) && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }
  return user;
};

// ...existing code...

