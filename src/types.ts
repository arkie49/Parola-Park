export interface Tour {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  rating?: number;
  reviews?: number;
}

export interface Facility {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'Equipment' | 'Facility';
  rating?: number;
  reviews?: number;
}

export type Screen = 'splash' | 'home' | 'discover' | 'reserve' | 'profile' | 'auth' | 'checkout' | 'success' | 'admin';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  type: 'tour' | 'facility';
  quantity?: number;
}
