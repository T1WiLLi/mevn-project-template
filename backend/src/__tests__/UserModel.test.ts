import { UserModel } from '../models/User';

describe('UserModel', () => {
    it('should create a user', async () => {
        const user = new UserModel({ name: 'Alice' });
        expect(user.name).toBe('Alice');
    });
});