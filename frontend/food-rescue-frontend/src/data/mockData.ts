export type FoodCategory = 'Produce' | 'Bakery' | 'Dairy' | 'Cooked Meals' | 'Packaged' | 'Beverages';
export type ListingStatus = 'available' | 'claimed' | 'picked_up' | 'expired';
export type UserRole = 'donor' | 'recipient';

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: FoodCategory;
  quantity: string;
  expiresAt: string;
  pickupWindow: string;
  pickupAddress: string;
  city: string;
  donorName: string;
  donorType: 'Restaurant' | 'Grocery Store' | 'Event Organizer' | 'Bakery';
  donorAvatar: string;
  status: ListingStatus;
  image: string;
  servings: number;
  postedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  avatar: string;
  joinedAt: string;
}

export const MOCK_STATS = {
  mealsSaved: 142830,
  activeDonors: 1240,
  ngoPartners: 318,
  communitiesServed: 892,
  citiesCovered: 47,
  co2Saved: 89.4,
};

export const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Fresh Sourdough Loaves',
    description: 'End-of-day unsold sourdough and whole wheat loaves. Perfectly fresh, baked this morning.',
    category: 'Bakery',
    quantity: '24 loaves',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    pickupWindow: 'Today 6:00 PM – 8:00 PM',
    pickupAddress: '14 Baker Street',
    city: 'New York',
    donorName: 'The Daily Crust',
    donorType: 'Bakery',
    donorAvatar: 'DC',
    status: 'available',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
    servings: 48,
    postedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    title: 'Mixed Vegetable Box',
    description: 'Assorted seasonal vegetables — carrots, zucchini, bell peppers, spinach. Near sell-by date but fully fresh.',
    category: 'Produce',
    quantity: '15 kg',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
    pickupWindow: 'Tomorrow 8:00 AM – 11:00 AM',
    pickupAddress: '88 Green Market Ave',
    city: 'Brooklyn',
    donorName: 'FreshMart Grocery',
    donorType: 'Grocery Store',
    donorAvatar: 'FM',
    status: 'available',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80',
    servings: 30,
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    title: 'Catered Event Leftovers',
    description: 'Post-conference buffet: rice, grilled chicken, salads, and desserts. Packed in sealed containers.',
    category: 'Cooked Meals',
    quantity: '80 portions',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    pickupWindow: 'Today 4:00 PM – 5:30 PM',
    pickupAddress: '200 Convention Blvd',
    city: 'Manhattan',
    donorName: 'Summit Events Co.',
    donorType: 'Event Organizer',
    donorAvatar: 'SE',
    status: 'available',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80',
    servings: 80,
    postedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: '4',
    title: 'Yogurt & Dairy Bundle',
    description: 'Assorted yogurts, cream cheese, and milk approaching best-before. All sealed and refrigerated.',
    category: 'Dairy',
    quantity: '40 units',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    pickupWindow: 'Tomorrow 10:00 AM – 1:00 PM',
    pickupAddress: '5 Dairy Lane',
    city: 'Queens',
    donorName: 'FreshMart Grocery',
    donorType: 'Grocery Store',
    donorAvatar: 'FM',
    status: 'claimed',
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80',
    servings: 40,
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '5',
    title: 'Restaurant Pasta & Sauces',
    description: "Freshly made pasta, marinara, and alfredo sauce from tonight's prep. Vacuum-sealed.",
    category: 'Cooked Meals',
    quantity: '30 portions',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    pickupWindow: 'Today 10:00 PM – 11:00 PM',
    pickupAddress: '77 Olive Garden Row',
    city: 'New York',
    donorName: 'Trattoria Bella',
    donorType: 'Restaurant',
    donorAvatar: 'TB',
    status: 'available',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    servings: 30,
    postedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: '6',
    title: 'Packaged Snack Assortment',
    description: 'Granola bars, trail mix, crackers, and juice boxes. Surplus from a school event.',
    category: 'Packaged',
    quantity: '120 items',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    pickupWindow: 'Flexible – within 3 days',
    pickupAddress: '33 Elm School Road',
    city: 'Bronx',
    donorName: 'Riverside Academy',
    donorType: 'Event Organizer',
    donorAvatar: 'RA',
    status: 'available',
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&q=80',
    servings: 120,
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

export const MOCK_DONOR_HISTORY: Listing[] = [
  { ...MOCK_LISTINGS[3], status: 'picked_up', id: 'h1' },
  { ...MOCK_LISTINGS[0], status: 'picked_up', id: 'h2', postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
  { ...MOCK_LISTINGS[2], status: 'expired', id: 'h3', postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
];

export const MOCK_RECIPIENT_CLAIMS = [
  { listing: MOCK_LISTINGS[3], claimedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), status: 'claimed' as ListingStatus },
  { listing: { ...MOCK_LISTINGS[0], status: 'picked_up' as ListingStatus }, claimedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), status: 'picked_up' as ListingStatus },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Marco Rossi', email: 'marco@trattoria.com', role: 'donor', organization: 'Trattoria Bella', avatar: 'MR', joinedAt: '2024-01-15' },
  { id: 'u2', name: 'Aisha Patel', email: 'aisha@hopeshelf.org', role: 'recipient', organization: 'Hope Shelf NGO', avatar: 'AP', joinedAt: '2024-02-20' },
  { id: 'u3', name: 'James Okafor', email: 'james@communityfood.org', role: 'recipient', organization: 'Community Food Bank', avatar: 'JO', joinedAt: '2024-03-10' },
];

export const IMPACT_TIMELINE = [
  { year: '2021', meals: 8200, donors: 45, ngos: 12 },
  { year: '2022', meals: 31500, donors: 180, ngos: 67 },
  { year: '2023', meals: 89000, donors: 620, ngos: 198 },
  { year: '2024', meals: 142830, donors: 1240, ngos: 318 },
];
