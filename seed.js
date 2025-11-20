import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB for seeding'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['ADMIN', 'TEACHER', 'STUDENT'] }
});

const User = mongoose.model('User', userSchema);

const users = [
    { name: 'Admin User', email: 'admin@school.edu', role: 'ADMIN', password: '123' },
    { name: 'Prof. Albus', email: 'teacher@school.edu', role: 'TEACHER', password: '123' },
    { name: 'Harry P.', email: 'student1@school.edu', role: 'STUDENT', password: '123' },
    { name: 'Hermione G.', email: 'student2@school.edu', role: 'STUDENT', password: '123' },
    { name: 'Ron W.', email: 'student3@school.edu', role: 'STUDENT', password: '123' },
];

const seed = async () => {
    try {
        await User.deleteMany({}); // Clear existing users
        await User.insertMany(users);
        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seed();
