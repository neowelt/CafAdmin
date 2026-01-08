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
  logoUrl?: string; // Optional partner logo URL (S3 public URL)
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
  logoUrl?: string;
}
