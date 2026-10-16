import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, UserRole } from '../types';

export interface IDemoAccount {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  roleLabel: string;
  organizationName: string;
  email: string;
  phone: string;
}

export const DEMO_PRESETS: IDemoAccount[] = [
  {
    id: 'HZU-001',
    name: 'Harinitha (Admin)',
    username: 'harinitha_admin',
    role: 'ADMIN',
    roleLabel: 'Central Control & Admin',
    organizationName: 'HazTrack Central Control & Compliance (EEC)',
    email: 'harinitha.admin@haztrack.eec.edu',
    phone: '+91 94440 88901',
  },
  {
    id: 'HZU-002',
    name: 'Rinitha (Lab Generator)',
    username: 'rinitha_lab',
    role: 'LABORATORY',
    roleLabel: 'Laboratory / Generator',
    organizationName: 'Apex Chemical R&D Labs',
    email: 'rinitha@apexresearch.org',
    phone: '+91 94440 88902',
  },
  {
    id: 'HZU-003',
    name: 'Harini (Industry Generator)',
    username: 'harini_industry',
    role: 'INDUSTRY',
    roleLabel: 'Industrial Generator',
    organizationName: 'Titan Petrochemicals Ltd.',
    email: 'harini@titanpetro.com',
    phone: '+91 94440 88903',
  },
  {
    id: 'HZU-004',
    name: 'Rini (Hazmat Transporter)',
    username: 'rini_transporter',
    role: 'TRANSPORTER',
    roleLabel: 'Transporter (EcoHaul)',
    organizationName: 'EcoHaul Hazmat Transport Logistics',
    email: 'rini@ecohaul.in',
    phone: '+91 94440 88904',
  },
  {
    id: 'HZU-005',
    name: 'Shravan (Fleet Transporter)',
    username: 'shravan_transporter',
    role: 'TRANSPORTER',
    roleLabel: 'Transporter (Vanguard)',
    organizationName: 'Vanguard Hazmat Fleet Express',
    email: 'shravan@vanguardlogistics.in',
    phone: '+91 94440 88905',
  },
  {
    id: 'HZU-006',
    name: 'Ravan (Facility Manager)',
    username: 'ravan_facility',
    role: 'TREATMENT_FACILITY',
    roleLabel: 'Treatment Facility (GreenSafe)',
    organizationName: 'GreenSafe Neutralization & Recovery Plant',
    email: 'ravan@greensafe.in',
    phone: '+91 94440 88906',
  },
  {
    id: 'HZU-007',
    name: 'Avan (Incineration Plant)',
    username: 'avan_facility',
    role: 'TREATMENT_FACILITY',
    roleLabel: 'Treatment Facility (BioClean)',
    organizationName: 'BioClean High-Temp Incineration Facility',
    email: 'avan@bioclean.in',
    phone: '+91 94440 88907',
  },
];

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  setDemoRole: (role: UserRole) => void;
  switchUserQuick: (identifierOrUsername: string) => void;
  login: (identifier: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser>(() => {
    const saved = localStorage.getItem('haztrack_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    const defaultAcc = DEMO_PRESETS[0];
    return {
      userId: defaultAcc.id,
      name: defaultAcc.name,
      username: defaultAcc.username,
      email: defaultAcc.email,
      role: defaultAcc.role,
      organizationName: defaultAcc.organizationName,
      status: 'ACTIVE',
      phone: defaultAcc.phone,
      activeSessions: 1,
      failedAttempts: 0,
    };
  });

  const [token] = useState<string>('DEMO_JWT_SESSION_ACTIVE');
  const [isLoading] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('haztrack_token', token);
    localStorage.setItem('haztrack_user', JSON.stringify(user));
  }, [user, token]);

  const setDemoRole = (role: UserRole) => {
    const matchedPreset = DEMO_PRESETS.find((p) => p.role === role) || DEMO_PRESETS[0];
    const newUser: IUser = {
      userId: matchedPreset.id,
      name: matchedPreset.name,
      username: matchedPreset.username,
      email: matchedPreset.email,
      role: matchedPreset.role,
      organizationName: matchedPreset.organizationName,
      status: 'ACTIVE',
      phone: matchedPreset.phone,
      activeSessions: 1,
      failedAttempts: 0,
    };
    setUser(newUser);
    localStorage.setItem('haztrack_user', JSON.stringify(newUser));
  };

  const switchUserQuick = (identifierOrUsername: string) => {
    const clean = identifierOrUsername.trim().toLowerCase();
    const matched =
      DEMO_PRESETS.find(
        (p) =>
          p.username.toLowerCase() === clean ||
          p.id.toLowerCase() === clean ||
          p.name.toLowerCase().includes(clean)
      ) || DEMO_PRESETS[0];

    const newUser: IUser = {
      userId: matched.id,
      name: matched.name,
      username: matched.username,
      email: matched.email,
      role: matched.role,
      organizationName: matched.organizationName,
      status: 'ACTIVE',
      phone: matched.phone,
      activeSessions: 1,
      failedAttempts: 0,
    };
    setUser(newUser);
    localStorage.setItem('haztrack_user', JSON.stringify(newUser));
  };

  const login = async (identifier: string) => {
    switchUserQuick(identifier);
  };

  const logout = () => {
    // In demo mode, reset to default Admin role
    setDemoRole('ADMIN');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: true,
        isLoading,
        activeRole: user.role,
        setDemoRole,
        switchUserQuick,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
