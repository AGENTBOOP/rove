export type DealCategory =
  | 'GPU'
  | 'Laptop'
  | 'Console'
  | 'Camera'
  | 'Audio'
  | 'Networking'
  | 'CPU'
  | 'Storage'
  | 'Smartphone'
  | 'Tablet';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export type DealSource =
  | 'eBay'
  | 'Facebook Marketplace'
  | 'Craigslist'
  | 'OfferUp'
  | 'Reddit'
  | 'B&H'
  | 'Newegg'
  | 'Best Buy Outlet';

export interface Deal {
  id: string;
  title: string;
  category: DealCategory;
  source: DealSource;
  imageUrl: string;
  buyPrice: number;
  estResalePrice: number;
  fees: number;
  shipping: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  confidence: ConfidenceLevel;
  postedAt: string; // ISO string
  externalUrl: string;
  saved: boolean;
}

export type LedgerStatus = 'Acquired' | 'Refurbishing' | 'Listed' | 'Sold';

export interface LedgerItem {
  id: string;
  title: string;
  category: DealCategory;
  buyPrice: number;
  salePrice: number | null;
  fees: number;
  shipping: number;
  status: LedgerStatus;
  acquiredAt: string;
  soldAt: string | null;
  imageUrl: string;
  notes: string;
}

export interface Watchlist {
  id: string;
  name: string;
  category: DealCategory | 'All';
  keywords: string;
  maxBuyPrice: number;
  minProfitMargin: number;
  minROI: number;
  notificationsEnabled: boolean;
  createdAt: string;
  matchCount: number;
}
