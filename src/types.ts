export interface Tour {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
}

export interface Facility {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'Equipment' | 'Facility';
}

export type Screen = 'splash' | 'home' | 'discover' | 'reserve' | 'profile' | 'auth' | 'checkout' | 'success';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  type: 'tour' | 'facility';
}
