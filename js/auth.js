/* ========================================
   AUTH MODULE
   ======================================== */

const Auth = {
    currentUser: null,

    login(email, password) {
        const users = DB.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = user;
            DB.set('currentUser', user);
            DB.addLegalRecord(user.id, 'acesso', 'Login realizado');
            return user;
        }
        return null;
    },

    demoLogin(type) {
        const demoUsers = {
            admin: { email: 'admin@senior.com', password: 'admin123' },
            supervisor: { email: 'supervisor@senior.com', password: 'super123' },
            funcionario: { email: 'maria@senior.com', password: 'func123' }
        };
        const demo = demoUsers[type];
        if (demo) return this.login(demo.email, demo.password);
        return null;
    },

    logout() {
        if (this.currentUser) {
            DB.addLegalRecord(this.currentUser.id, 'acesso', 'Logout realizado');
        }
        this.currentUser = null;
        DB.remove('currentUser');
    },

    restore() {
        const saved = DB.get('currentUser');
        if (saved) {
            // Refresh from DB
            const fresh = DB.getUser(saved.id);
            if (fresh) {
                this.currentUser = fresh;
                return fresh;
            }
        }
        return null;
    },

    isAdmin() {
        return this.currentUser?.role === 'admin';
    },

    isSupervisor() {
        return this.currentUser?.role === 'supervisor';
    },

    isEmployee() {
        const role = DB.getRole(this.currentUser?.role);
        return role && role.level === 1;
    },

    canManageUsers() {
        return this.isAdmin() || this.isSupervisor();
    },

    getUserSectors() {
        if (this.isAdmin() || this.isSupervisor()) {
            return DB.sectors;
        }
        const role = DB.getRole(this.currentUser?.role);
        if (role?.sector) {
            return DB.sectors.filter(s => s.id === role.sector);
        }
        return DB.sectors;
    },

    getPermissions() {
        if (this.isAdmin()) {
            return {
                dashboard: true, users: true, sectors: true, pops: true,
                training: true, tests: true, legal: true, tv: true,
                commercial: true, franchise: true, chat: true, allSectors: true
            };
        }
        if (this.isSupervisor()) {
            return {
                dashboard: true, users: true, sectors: true, pops: true,
                training: true, tests: true, legal: true, tv: true,
                commercial: false, franchise: false, chat: true, allSectors: true
            };
        }
        return {
            dashboard: true, users: false, sectors: false, pops: true,
            training: true, tests: true, legal: false, tv: false,
            commercial: false, franchise: false, chat: true, allSectors: false
        };
    }
};
