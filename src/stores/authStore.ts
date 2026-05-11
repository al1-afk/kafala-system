import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role } from "../types";
import { uid } from "../lib/utils";

interface AuthState {
  users: User[];
  currentUser: User | null;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => { ok: boolean; error?: string };
  addUser: (u: Omit<User, "id" | "active"> & { active?: boolean }) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const seedUsers: User[] = [
  {
    id: uid("u_"),
    username: "admin",
    fullName: "المدير العام",
    password: "modp",
    role: "directeur",
    active: true,
  },
  {
    id: uid("u_"),
    username: "assistante",
    fullName: "مسؤولة الملفات",
    password: "assist123",
    role: "assistante",
    active: true,
  },
  {
    id: uid("u_"),
    username: "lecteur",
    fullName: "مستخدم القراءة",
    password: "view123",
    role: "lecteur",
    active: true,
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      currentUser: null,
      login: (username, password) => {
        const u = get().users.find(
          (x) => x.username.toLowerCase() === username.toLowerCase() && x.password === password && x.active
        );
        if (!u) return { ok: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
        const stamped = { ...u, lastLogin: new Date().toISOString() };
        set((s) => ({
          currentUser: stamped,
          users: s.users.map((x) => (x.id === u.id ? stamped : x)),
        }));
        return { ok: true };
      },
      logout: () => set({ currentUser: null }),
      changePassword: (oldPassword, newPassword) => {
        const u = get().currentUser;
        if (!u) return { ok: false, error: "يجب تسجيل الدخول" };
        if (u.password !== oldPassword) return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
        if (newPassword.length < 4) return { ok: false, error: "كلمة المرور الجديدة قصيرة جدا" };
        const updated = { ...u, password: newPassword };
        set((s) => ({
          currentUser: updated,
          users: s.users.map((x) => (x.id === u.id ? updated : x)),
        }));
        return { ok: true };
      },
      addUser: (u) =>
        set((s) => ({
          users: [...s.users, { ...u, id: uid("u_"), active: u.active ?? true }],
        })),
      updateUser: (id, patch) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
          currentUser:
            s.currentUser?.id === id ? { ...s.currentUser, ...patch } : s.currentUser,
        })),
      deleteUser: (id) =>
        set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
    }),
    { name: "kafala-auth" }
  )
);

export const roleLabels: Record<Role, string> = {
  directeur: "المدير",
  assistante: "مسؤولة الملفات",
  lecteur: "قارئ",
};

export function canEdit(role?: Role): boolean {
  return role === "directeur" || role === "assistante";
}

export function canManageUsers(role?: Role): boolean {
  return role === "directeur";
}
