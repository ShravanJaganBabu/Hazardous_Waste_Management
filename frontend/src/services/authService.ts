import api from './api';
import { IUser } from '../types';

export const authService = {
  login: async (identifier: string, password: string): Promise<{ token: string; user: IUser }> => {
    const res = await api.post('/auth/login', { identifier, password });
    return res.data;
  },

  getMe: async (): Promise<IUser> => {
    const res = await api.get('/auth/me');
    return res.data.user;
  },

  getAllUsers: async (): Promise<IUser[]> => {
    const res = await api.get('/auth/users');
    return res.data.users;
  },
};
