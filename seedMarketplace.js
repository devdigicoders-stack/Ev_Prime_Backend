require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  mrp: Number,
  category: String,
  images: [String],
  stock: Number,
  isActive: Boolean,
  isFeatured: Boolean,
  rating: Number,
  reviewCount: Number,
  tags: [String],
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

const products = [
  {
    name: 'Type 2 EV Charging Cable 32A',
    description: 'High-quality Type 2 to Type 2 charging cable for AC charging. Compatible with most EVs. 7.4kW fast charging support. 5 meter length with durable outer jacket.',
    price: 2499,
    mrp: 3999,
    category: 'Cables & Adapters',
    images: ['https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400'],
    stock: 50,
    isActive: true,
    isFeatured: true,
    rating: 4.5,
    reviewCount: 128,
    tags: ['type2', 'cable', 'ac charging', '32A'],
  },
  {
    name: 'Portable EV Charger 3.3kW',
    description: 'Compact portable charger for home and travel use. Plug into any standard 15A socket. LED indicator, overcharge protection, and weatherproof design.',
    price: 5999,
    mrp: 8499,
    category: 'Chargers',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    stock: 30,
    isActive: true,
    isFeatured: true,
    rating: 4.3,
    reviewCount: 89,
    tags: ['portable', 'charger', '3.3kW', 'home charging'],
  },
  {
    name: 'EV Car Body Cover - Premium',
    description: 'Waterproof and dustproof premium car body cover specially designed for electric vehicles. UV protection, soft inner lining, fits most EV sedans and hatchbacks.',
    price: 1299,
    mrp: 1999,
    category: 'EV Care',
    images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400'],
    stock: 100,
    isActive: true,
    isFeatured: false,
    rating: 4.1,
    reviewCount: 56,
    tags: ['cover', 'protection', 'waterproof', 'UV'],
  },
  {
    name: 'CCS2 to CHAdeMO Adapter',
    description: 'Universal DC fast charging adapter. Convert CCS2 connector to CHAdeMO. Supports up to 50kW DC fast charging. Built-in safety protection circuits.',
    price: 3499,
    mrp: 4999,
    category: 'Cables & Adapters',
    images: ['https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400'],
    stock: 25,
    isActive: true,
    isFeatured: false,
    rating: 4.0,
    reviewCount: 34,
    tags: ['CCS2', 'CHAdeMO', 'adapter', 'DC fast charging'],
  },
  {
    name: 'Bharat EV Prime T-Shirt',
    description: 'Official Bharat EV Prime branded t-shirt. 100% cotton, comfortable fit. Available in multiple sizes. Show your love for green mobility!',
    price: 499,
    mrp: 799,
    category: 'Merchandise',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
    stock: 200,
    isActive: true,
    isFeatured: false,
    rating: 4.6,
    reviewCount: 210,
    tags: ['tshirt', 'merchandise', 'cotton', 'branded'],
  },
  {
    name: 'EV Battery Conditioner Spray',
    description: 'Professional grade battery terminal conditioner and protector. Prevents corrosion, improves conductivity, extends battery life. Safe for all EV battery terminals.',
    price: 349,
    mrp: 499,
    category: 'EV Care',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    stock: 150,
    isActive: true,
    isFeatured: false,
    rating: 4.2,
    reviewCount: 67,
    tags: ['battery', 'conditioner', 'spray', 'maintenance'],
  },
  {
    name: 'Home Charging Installation Service',
    description: 'Professional home EV charger installation service. Includes site survey, wiring, mounting, and testing. Certified electricians. Covers up to 10 meters of cable run.',
    price: 2999,
    mrp: 4999,
    category: 'Services',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    stock: 999,
    isActive: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 312,
    tags: ['installation', 'service', 'home charging', 'professional'],
  },
  {
    name: 'EV Charging Station Finder - Premium Membership',
    description: '1 year premium membership for priority access to all Bharat EV charging stations. Includes 10% discount on all charging sessions, priority booking, and 24/7 support.',
    price: 999,
    mrp: 1999,
    category: 'Services',
    images: ['https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400'],
    stock: 999,
    isActive: true,
    isFeatured: true,
    rating: 4.7,
    reviewCount: 445,
    tags: ['membership', 'premium', 'discount', 'priority'],
  },
  {
    name: 'EV Windshield Sun Shade',
    description: 'Foldable reflective sun shade for EV windshield. Keeps cabin cool, protects dashboard. Reduces battery drain from AC. Fits most EV windshields.',
    price: 399,
    mrp: 599,
    category: 'Accessories',
    images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400'],
    stock: 80,
    isActive: true,
    isFeatured: false,
    rating: 4.0,
    reviewCount: 43,
    tags: ['sunshade', 'windshield', 'accessories', 'cooling'],
  },
  {
    name: 'Bharat EV Cap - Green Edition',
    description: 'Stylish Bharat EV branded cap. Adjustable strap, breathable fabric. Perfect for EV enthusiasts. Green color with embroidered logo.',
    price: 299,
    mrp: 499,
    category: 'Merchandise',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
    stock: 150,
    isActive: true,
    isFeatured: false,
    rating: 4.4,
    reviewCount: 88,
    tags: ['cap', 'merchandise', 'branded', 'green'],
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await Product.countDocuments();
    if (existing > 0) {
      console.log(`${existing} products already exist. Deleting and re-seeding...`);
      await Product.deleteMany({});
    }

    const inserted = await Product.insertMany(products);
    console.log(`✅ Successfully added ${inserted.length} products!`);
    inserted.forEach(p => console.log(`  - ${p.name} (${p.category}) ₹${p.price}`));

    await mongoose.disconnect();
    console.log('\nDone! Marketplace is ready.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedProducts();
