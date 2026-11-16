import { EncryptionService } from '../services/encryption.service';
import db from '../config/database';

async function testDec() {
    const rawPan = "f19f765ec6157fee9b90db8450299c2e:29f99ea5ff5b595ac9c672dc313a94a714d2cc38eed285176dd3129c95bb4d11e8a68f4dc783c27ab5bfb1695caa036230258e491ed80d1bb6e34ee07566ef7a256e43157e64455c1952fd0f53cb9db9";
    const dec = EncryptionService.decrypt(rawPan);
    console.log("Decrypted PAN:", dec);
    process.exit(0);
}
testDec();
