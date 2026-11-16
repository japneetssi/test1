import { UserModel } from '../models/user.model';
import db from '../config/database';

async function createSuperAdmin() {
    try {
        // Check if admin already exists
        const existing = await UserModel.findByEmail('admin@wealthmax.com');
        if (existing) {
            console.log('Admin already exists. Updating role to admin...');
            await UserModel.updateProfile(existing.id, { role: 'admin' as any });
            console.log('Admin role updated to admin.');
            return;
        }

        const superAdmin = await UserModel.create({
            email: 'admin@wealthmax.com',
            mobile: '9999999999',
            full_name: 'Super Admin',
            role: 'admin' as any
        });
        console.log('Super Admin created successfully:', superAdmin);
    } catch (error) {
        console.error('Error creating Super Admin:', error);
    } finally {
        process.exit();
    }
}

createSuperAdmin();
