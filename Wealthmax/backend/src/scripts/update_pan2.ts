import db from '../config/database';
import { EncryptionService } from '../services/encryption.service';
import logger from '../config/logger';

async function updatePan() {
    try {
        const pan = "NVBPS3921C";
        const encryptedPan = EncryptionService.encrypt(pan);
        
        // update users table
        await db.query(`UPDATE users SET pan = $1 WHERE email = 'aashish.sssindustries@gmail.com'`, [encryptedPan]);
        // update profiles table 
        await db.query(`UPDATE profiles SET pan_number = $1 WHERE user_id = (SELECT id FROM users WHERE email = 'aashish.sssindustries@gmail.com')`, [encryptedPan]);
        
        console.log("Updated PAN successfully to NVBPS3921C");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

updatePan();
