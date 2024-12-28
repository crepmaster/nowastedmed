import { AuthStorage } from '../auth/storage/auth.storage';

export class DebugUtil {
    static printRegisteredUsers() {
        const storage = AuthStorage.getInstance();
        const users = storage.loadUsers();
        console.log('=== Registered Users ===');
        console.log(JSON.stringify(users, null, 2));
        console.log('=======================');
        return users;
    }
}