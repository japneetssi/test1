import db from '../config/database';

async function checkData() {
    try {
        const profileRes = await db.query(`SELECT user_id, dob, pan_number FROM profiles LIMIT 1;`);
        console.log("Profile Data:", profileRes.rows[0]);
        const userRes = await db.query(`SELECT id, pan FROM users WHERE id = $1;`, [profileRes.rows[0]?.user_id]);
        console.log("User Data:", userRes.rows[0]);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkData();
