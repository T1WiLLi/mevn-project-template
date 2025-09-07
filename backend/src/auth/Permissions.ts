export default class Permissions {
    static User = class {
        static readonly READ = "user:read";
        static readonly WRITE = "user:write";
        static readonly UPDATE = "user:update";
        static readonly DELETE = "user:delete";
        static readonly ALL = [this.READ, this.WRITE, this.UPDATE, this.DELETE];
    }
}