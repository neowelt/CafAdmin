export interface PartnerColors {
  background: string;
  border: string;
  foreground: string;
  primary: string;
}

export interface Partner {
  partnerId: string;
  name: string;
  allowedDomains: string[];
  colors: PartnerColors;
  revenueShare: number; // Stored as float (0.0 - 1.0)
  sandbox: boolean;
  createdAt: string;
}

export interface CreatePartnerRequest {
  partnerId: string;
  name: string;
  allowedDomains: string[];
  colors: PartnerColors;
  revenueShare: number;
  sandbox: boolean;
}

export interface UpdatePartnerRequest {
  partnerId?: string;
  name?: string;
  allowedDomains?: string[];
  colors?: PartnerColors;
  revenueShare?: number;
  sandbox?: boolean;
}
