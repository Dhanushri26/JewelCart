export const categories = [
  'Rings',
  'Necklaces',
  'Bracelets',
  'Chains',
  'Bangles',
  'Earrings',
  'Pendants',
  'Wedding Sets',
  'Gemstones',
  'Watches',
]

export const products = Array.from({ length: 100 }, (_, index) => {
  const nameOptions = [
    '18K Diamond Engagement Ring',
    'Royal Emerald Necklace',
    'Ruby Halo Pendant',
    'Classic Gold Chain',
    'Diamond Tennis Bracelet',
    'Rose Gold Infinity Ring',
    'Blue Sapphire Stud Earrings',
    'Certified Emerald Stone Ring',
    'Yellow Sapphire Pendant',
    'Pearl Necklace',
    'Moissanite Halo Ring',
    'Luxury Diamond Watch',
    'Opal Gemstone Pendant',
    'Amethyst Tennis Bracelet',
    'Platinum Wedding Set',
  ]
  const metals = ['Gold', 'Rose Gold', 'Silver', 'Platinum']
  const stones = ['Diamond', 'Emerald', 'Ruby', 'Sapphire', 'Pearl', 'Opal', 'Amethyst', 'Moissanite']
  const categoriesList = ['Rings', 'Necklaces', 'Bracelets', 'Chains', 'Earrings', 'Pendants', 'Wedding Sets', 'Gemstones', 'Watches']
  const collections = ['Bridal', 'Limited Edition', 'Signature', 'New Arrivals', 'Best Sellers']

  const price = 1200 + (index % 17) * 180 + (index % 5) * 60
  const discount = [0, 5, 8, 12, 15][index % 5]
  const stock = index % 4 === 0 ? 0 : 8 + (index % 7)

  return {
    id: index + 1,
    name: `${nameOptions[index % nameOptions.length]} ${index + 1}`,
    description: 'Crafted in our atelier with certified stones, refined detailing, and exceptional brilliance.',
    price,
    discount,
    stock,
    rating: 4 + (index % 6) * 0.2,
    reviews: 45 + (index % 20) * 12,
    metal: metals[index % metals.length],
    stone: stones[index % stones.length],
    purity: index % 2 === 0 ? '18K' : '22K',
    weight: `${(index % 6 + 2.5).toFixed(1)} g`,
    category: categoriesList[index % categoriesList.length],
    collection: collections[index % collections.length],
    badge: index % 3 === 0 ? 'Bestseller' : index % 5 === 0 ? 'Limited' : 'New',
    image: `https://images.unsplash.com/photo-${['1512436991641-6745cdb1723f', '1617038260897-8c0b5a2f1d7a', '1601828186930-3ef0b0e7d6d9', '1617038220311-1f6f7f2b4c1f', '1523170335255-f5ed118b9e9d'][index % 5]}?auto=format&fit=crop&w=900&q=80`,
  }
})

export const orders = [
  {
    id: 'ORD-1042',
    date: '2026-07-02',
    total: 28500,
    status: 'Delivered',
    paymentStatus: 'Paid',
    items: [products[0], products[2]].map((product) => ({ ...product, quantity: 1 })),
  },
  {
    id: 'ORD-1038',
    date: '2026-06-28',
    total: 14200,
    status: 'Shipped',
    paymentStatus: 'Paid',
    items: [products[3], products[4]].map((product) => ({ ...product, quantity: 1 })),
  },
]
