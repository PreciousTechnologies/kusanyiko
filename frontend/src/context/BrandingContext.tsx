import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { brandingAPI } from '../services/api';

export interface BrandingSettings {
  app_name: string;
  app_subtitle: string;
  landing_header_title: string;
  landing_header_subtitle: string;
  landing_hero_prefix: string;
  landing_hero_highlight: string;
  landing_hero_suffix: string;
  landing_description: string;
  ministry_lead: string;
  camp_location: string;
  camp_start_date: string;
  camp_end_date: string;
  registration_status_label: string;
  admin_dashboard_subtitle: string;
  registrant_dashboard_subtitle: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  app_name: "Efatha Leaders' Camp",
  app_subtitle: "EFATHA Leaders' Camp Registration • Kibaha",
  landing_header_title: "Efatha Leaders' Camp",
  landing_header_subtitle: 'Kibaha Leadership Registration Portal',
  landing_hero_prefix: 'Welcome to',
  landing_hero_highlight: "Efatha Leaders' Camp",
  landing_hero_suffix: 'Registration',
  landing_description:
    'Register church leaders for the Kibaha camp where spiritual services are ministered by Apostle and Prophet Josephat Elias Mwingira at Precious Centre, Kibaha.',
  ministry_lead: 'Apostle and Prophet Josephat Elias Mwingira',
  camp_location: 'Precious Centre, Kibaha',
  camp_start_date: 'October 6, 2025',
  camp_end_date: 'October 12, 2025',
  registration_status_label: 'Camp Registration Active',
  admin_dashboard_subtitle: "EFATHA Leaders' Camp Dashboard",
  registrant_dashboard_subtitle: "EFATHA Leaders' Camp • Your registration dashboard",
};

interface BrandingContextValue {
  branding: BrandingSettings;
  loading: boolean;
  refreshBranding: () => Promise<void>;
  updateBranding: (updates: Partial<BrandingSettings>) => Promise<BrandingSettings>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const refreshBranding = async () => {
    try {
      const response = await brandingAPI.getBranding();
      setBranding({ ...DEFAULT_BRANDING, ...(response.data || {}) });
    } catch (error) {
      setBranding(DEFAULT_BRANDING);
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (updates: Partial<BrandingSettings>) => {
    const response = await brandingAPI.updateBranding(updates);
    const merged = { ...DEFAULT_BRANDING, ...(response.data || {}) } as BrandingSettings;
    setBranding(merged);
    return merged;
  };

  useEffect(() => {
    refreshBranding();
  }, []);

  useEffect(() => {
    document.title = branding.app_name;
  }, [branding.app_name]);

  const value = useMemo(
    () => ({ branding, loading, refreshBranding, updateBranding }),
    [branding, loading]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};

export const useBranding = (): BrandingContextValue => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
};
