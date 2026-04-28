import { Tour, Facility } from './types';
import t1Img from '../asset/parola-park.jpg';
import t2Img from '../asset/parola-park (1).jpg';
import t3Img from '../asset/parola-park (2).jpg';
import f1Img from '../asset/parola1.jpg';
import f2Img from '../asset/parola2.jpg';

export const TOURS: Tour[] = [
  {
    id: 't1',
    title: 'Historical Tour',
    description: 'Explore the 1861 watchtower and historic cannons.',
    price: 11,
    image: t1Img,
    rating: 4.8,
    reviews: 124,
  },
  {
    id: 't2',
    title: 'Sunset Viewing',
    description: 'Experience the best sunset view in town from the lighthouse.',
    price: 0,
    image: t2Img,
    rating: 4.9,
    reviews: 210,
  },
  {
    id: 't3',
    title: 'Urban Guide',
    description: 'Professional guide for your group (per day).',
    price: 1000,
    image: t3Img,
    rating: 4.5,
    reviews: 89,
  },
];

export const FACILITIES: Facility[] = [
  {
    id: 'f1',
    name: 'Entrance Fee',
    price: 11,
    category: 'Facility',
    image: f1Img,
    rating: 4.7,
    reviews: 502,
  },
];
