'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getProfile, saveProfile } from '../lib/store';

const ProfileCtx = createContext(null);
export const useProfile = () => useContext(ProfileCtx);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState({ nama: '', foto: null });

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const save = (nama, foto) => {
    setProfile(saveProfile({ nama, foto }));
  };

  return <ProfileCtx.Provider value={{ profile, save }}>{children}</ProfileCtx.Provider>;
}
