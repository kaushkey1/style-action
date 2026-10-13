export interface Brand {
  id: string;
  name: string;
  type: string;
  aesthetic: string;
  description: string;
  logo: string;
  coverImage: string;
  priceRange: {
    min: number;
    max: number;
  };
  established: number;
  headquarters: string;
  socialMedia: {
    instagram: string;
    website: string;
  };
}

export interface Collection {
  id: string;
  name: string;
  theme: string;
  season: string;
  categories: string[];
  productCount: number;
  products: string[];
  heroImage: string;
  galleryImages: string[];
  colorStory: string[];
  priceRange: {
    min: number;
    max: number;
  };
  launchDate: string;
  status: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  brand: string;
  brandId: string;
  collection: string;
  collectionId: string;
  season: string;
  category: string;
  images: string[];
  primaryImage: string;
  thumbnailImage: string;
  colors: string[];
  price: {
    mrp: number;
    currency: string;
    wholesale_tiers: {
      quantity: number;
      discount: number;
    }[];
  };
  sizes: string[];
  materials: string;
  inventory: {
    available: boolean;
    quantity: number;
    status: string;
  };
  metadata: {
    slide: number;
    extracted: string;
    dimensions: {
      width: number;
      height: number;
    };
    tags: string[];
    aiTags: string;
  };
  ratings: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BrandCollection {
  brand: Brand;
  collections: Collection[];
  products: Product[];
}

export type ViewMode = 'discover' | 'collections' | 'products';

export type DiscoverLayout = 'feed' | 'grid' | 'collections';
