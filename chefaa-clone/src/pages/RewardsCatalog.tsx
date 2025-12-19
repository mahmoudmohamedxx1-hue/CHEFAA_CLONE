import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Gift, 
  Truck, 
  Phone, 
  Star, 
  Heart, 
  Calendar,
  Zap,
  Crown,
  Percent,
  ShoppingBag,
  Pill,
  Utensils,
  Gamepad2
} from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  cost: number;
  originalValue?: number;
  category: 'discount' | 'delivery' | 'service' | 'product' | 'experience';
  subcategory: string;
  icon: React.ReactNode;
  image?: string;
  isAvailable: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isExclusive?: boolean;
  isLimited?: boolean;
  expiresAt?: string;
  remainingQuantity?: number;
  tierRestriction?: string[];
  terms: string[];
  howToUse: string[];
}

interface RewardsCatalogProps {
  availablePoints: number;
  currentTier: string;
  onRedeemReward: (rewardId: string) => void;
}

// Mock data - replace with actual API calls
const MOCK_REWARDS: Reward[] = [
  // Discount Rewards
  {
    id: 'birthday-discount',
    name: 'Birthday Special 15% Discount',
    description: 'Celebrate your special day with 15% off your entire order during your birthday month',
    shortDescription: '15% off your birthday month purchase',
    cost: 0,
    originalValue: 500,
    category: 'discount',
    subcategory: 'birthday',
    icon: <Gift className="w-5 h-5" />,
    isAvailable: true,
    isPopular: true,
    tierRestriction: ['Silver', 'Gold', 'Platinum'],
    terms: [
      'Valid only during your birthday month',
      'Cannot be combined with other discounts',
      'Valid for orders over 100 EGP'
    ],
    howToUse: [
      'Automatically applied during checkout in birthday month',
      'No code required'
    ]
  },
  {
    id: 'consultation-discount-25',
    name: 'Telemedicine 25% Off',
    description: 'Get 25% off your telemedicine consultation with our healthcare professionals',
    shortDescription: '25% off telemedicine consultations',
    cost: 250,
    category: 'discount',
    subcategory: 'consultation',
    icon: <Phone className="w-5 h-5" />,
    isAvailable: true,
    isPopular: true,
    tierRestriction: ['Gold', 'Platinum'],
    terms: [
      'Valid for video consultations only',
      'Cannot be combined with insurance coverage',
      'Valid for one consultation per month'
    ],
    howToUse: [
      'Book consultation through app',
      'Discount applied automatically'
    ]
  },
  {
    id: 'free-shipping',
    name: 'Free Express Shipping',
    description: 'Get free express shipping on your next order',
    shortDescription: 'Free express delivery',
    cost: 150,
    category: 'discount',
    subcategory: 'shipping',
    icon: <Truck className="w-5 h-5" />,
    isAvailable: true,
    isNew: true,
    tierRestriction: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    terms: [
      'Valid for one order',
      'Express shipping only',
      'Maximum 2kg weight limit'
    ],
    howToUse: [
      'Select express shipping at checkout',
      'Discount applied automatically'
    ]
  },

  // Product Rewards
  {
    id: 'vitamins-bundle',
    name: 'Essential Vitamins Bundle',
    description: 'Complete vitamin set including Vitamin C, D3, B12, and Multivitamins',
    shortDescription: 'Complete vitamin supplement set',
    cost: 800,
    originalValue: 1200,
    category: 'product',
    subcategory: 'supplements',
    icon: <Pill className="w-5 h-5" />,
    image: '/images/vitamins-bundle.jpg',
    isAvailable: true,
    isPopular: true,
    isLimited: true,
    remainingQuantity: 5,
    tierRestriction: ['Gold', 'Platinum'],
    terms: [
      'While supplies last',
      'No returns or exchanges',
      '30-day expiry date from delivery'
    ],
    howToUse: [
      'Add to cart during checkout',
      'Free delivery included'
    ]
  },
  {
    id: 'healthcare-kit',
    name: 'Premium Healthcare Kit',
    description: 'Professional-grade blood pressure monitor, thermometer, and first aid supplies',
    shortDescription: 'Professional healthcare monitoring kit',
    cost: 1200,
    originalValue: 1800,
    category: 'product',
    subcategory: 'medical-devices',
    icon: <Heart className="w-5 h-5" />,
    isAvailable: true,
    isExclusive: true,
    tierRestriction: ['Platinum'],
    terms: [
      'One-time redemption only',
      '2-year warranty included',
      'Professional use recommended'
    ],
    howToUse: [
      'Added to cart automatically',
      'Delivery within 2-3 business days'
    ]
  },

  // Service Rewards
  {
    id: 'personalized-consultation',
    name: 'Personalized Health Consultation',
    description: 'One-on-one consultation with our expert pharmacist for personalized health advice',
    shortDescription: 'Expert pharmacist consultation',
    cost: 300,
    originalValue: 500,
    category: 'service',
    subcategory: 'consultation',
    icon: <Star className="w-5 h-5" />,
    isAvailable: true,
    tierRestriction: ['Silver', 'Gold', 'Platinum'],
    terms: [
      '60-minute session',
      'By appointment only',
      'Valid for 6 months'
    ],
    howToUse: [
      'Book through app scheduling',
      'Confirmation email sent'
    ]
  },
  {
    id: 'family-health-plan',
    name: 'Family Health Monitoring Plan',
    description: 'Monthly health check-ups and medication management for up to 4 family members',
    shortDescription: 'Comprehensive family health service',
    cost: 2000,
    category: 'service',
    subcategory: 'family-care',
    icon: <Heart className="w-5 h-5" />,
    isAvailable: true,
    isExclusive: true,
    expiresAt: '2025-12-31',
    tierRestriction: ['Platinum'],
    terms: [
      'Valid for 12 months',
      'Up to 4 family members',
      'Monthly check-ups included'
    ],
    howToUse: [
      'Contact family care coordinator',
      'Plan activated within 24 hours'
    ]
  },

  // Experience Rewards
  {
    id: 'wellness-workshop',
    name: 'Virtual Wellness Workshop',
    description: 'Join our monthly virtual workshops on nutrition, fitness, and wellness',
    shortDescription: 'Monthly wellness education session',
    cost: 100,
    category: 'experience',
    subcategory: 'education',
    icon: <Zap className="w-5 h-5" />,
    isAvailable: true,
    tierRestriction: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    terms: [
      'Live online session',
      'Recording available for 7 days',
      'Certificate of completion'
    ],
    howToUse: [
      'Register through app events',
      'Calendar invitation sent'
    ]
  },
  {
    id: 'spa-voucher',
    name: 'Relaxation Spa Day Voucher',
    description: 'Full day spa experience with massage, facial, and wellness treatments',
    shortDescription: 'Complete spa relaxation experience',
    cost: 2500,
    originalValue: 3000,
    category: 'experience',
    subcategory: 'relaxation',
    icon: <Heart className="w-5 h-5" />,
    isAvailable: true,
    isLimited: true,
    remainingQuantity: 3,
    expiresAt: '2025-12-31',
    tierRestriction: ['Platinum'],
    terms: [
      'Valid for 6 months',
      'Advance booking required',
      'Transportation not included'
    ],
    howToUse: [
      'Contact spa partner directly',
      'Voucher code provided via email'
    ]
  },

  // Birthday & Special Rewards
  {
    id: 'birthday-cake',
    name: 'Celebration Birthday Cake',
    description: 'Free custom birthday cake from our partner bakery (1kg)',
    shortDescription: 'Free birthday cake (1kg)',
    cost: 400,
    category: 'experience',
    subcategory: 'celebration',
    icon: <Utensils className="w-5 h-5" />,
    isAvailable: true,
    tierRestriction: ['Gold', 'Platinum'],
    terms: [
      'Valid only on birthday',
      '24-hour notice required',
      'Flavor selection available'
    ],
    howToUse: [
      'Order 24 hours in advance',
      'Delivery on birthday'
    ]
  },

  // Anniversary Rewards
  {
    id: 'anniversary-bonus',
    name: 'Anniversary Special Bonus',
    description: 'Special anniversary bonus points and exclusive rewards',
    shortDescription: 'Anniversary celebration bonus',
    cost: 0,
    category: 'experience',
    subcategory: 'anniversary',
    icon: <Calendar className="w-5 h-5" />,
    isAvailable: true,
    tierRestriction: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    terms: [
      'Automatic on anniversary date',
      '1000 bonus points',
      'Special gift included'
    ],
    howToUse: [
      'Automatically credited',
      'Gift shipped separately'
    ]
  },

  // Game & Entertainment
  {
    id: 'fitness-class',
    name: 'Virtual Fitness Class Pass',
    description: 'Access to monthly virtual fitness classes with certified trainers',
    shortDescription: 'Monthly fitness class access',
    cost: 200,
    category: 'experience',
    subcategory: 'fitness',
    icon: <Zap className="w-5 h-5" />,
    isAvailable: true,
    tierRestriction: ['Silver', 'Gold', 'Platinum'],
    terms: [
      'Valid for 30 days',
      'All fitness levels welcome',
      'Equipment needed'
    ],
    howToUse: [
      'Book class slots through app',
      'Access link sent via email'
    ]
  }
];

export const RewardsCatalog: React.FC<RewardsCatalogProps> = ({
  availablePoints,
  currentTier,
  onRedeemReward
}) => {
  const [rewards, setRewards] = useState<Reward[]>(MOCK_REWARDS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>(MOCK_REWARDS);

  const categories = [
    { id: 'all', name: 'All Rewards', icon: <Gift className="w-4 h-4" /> },
    { id: 'discount', name: 'Discounts', icon: <Percent className="w-4 h-4" /> },
    { id: 'product', name: 'Products', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'service', name: 'Services', icon: <Star className="w-4 h-4" /> },
    { id: 'experience', name: 'Experiences', icon: <Gamepad2 className="w-4 h-4" /> }
  ];

  // Filter and sort rewards
  useEffect(() => {
    let filtered = rewards.filter(reward => {
      const categoryMatch = activeCategory === 'all' || reward.category === activeCategory;
      const searchMatch = searchQuery === '' || 
        reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return categoryMatch && searchMatch;
    });

    // Sort rewards
    switch (sortBy) {
      case 'cost-low':
        filtered.sort((a, b) => a.cost - b.cost);
        break;
      case 'cost-high':
        filtered.sort((a, b) => b.cost - a.cost);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default: // recommended
        filtered.sort((a, b) => {
          const aScore = (a.isPopular ? 2 : 0) + (a.isNew ? 1 : 0) + (a.isExclusive ? 1 : 0);
          const bScore = (b.isPopular ? 2 : 0) + (b.isNew ? 1 : 0) + (b.isExclusive ? 1 : 0);
          return bScore - aScore;
        });
    }

    setFilteredRewards(filtered);
  }, [rewards, activeCategory, searchQuery, sortBy]);

  const getTierIndex = (tier: string) => {
    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    return tiers.indexOf(tier);
  };

  const isEligible = (reward: Reward) => {
    if (!reward.tierRestriction || reward.tierRestriction.length === 0) return true;
    const currentTierIndex = getTierIndex(currentTier);
    return reward.tierRestriction.some(tier => getTierIndex(tier) <= currentTierIndex);
  };

  const canRedeem = (reward: Reward) => {
    return isEligible(reward) && availablePoints >= reward.cost && reward.isAvailable;
  };

  const isExpiringSoon = (reward: Reward) => {
    if (!reward.expiresAt) return false;
    const expiryDate = new Date(reward.expiresAt);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rewards Catalog</h1>
        <p className="text-gray-600">Redeem your points for exclusive rewards and experiences</p>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search rewards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recommended">Recommended</option>
              <option value="cost-low">Cost: Low to High</option>
              <option value="cost-high">Cost: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                {category.icon}
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Card>

      {/* Points Balance Display */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-full">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Available Points</h3>
              <p className="text-sm text-gray-600">Ready to redeem</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{availablePoints.toLocaleString()}</div>
            <p className="text-sm text-gray-600">Points available</p>
          </div>
        </div>
      </Card>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map((reward) => {
          const eligible = isEligible(reward);
          const canRedeemReward = canRedeem(reward);
          const expiringSoon = isExpiringSoon(reward);
          
          return (
            <Card 
              key={reward.id} 
              className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
                !eligible ? 'opacity-60' : ''
              } ${!canRedeemReward && eligible ? 'border-red-200' : ''}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {reward.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                        {reward.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {reward.cost === 0 ? (
                      <Badge className="bg-green-100 text-green-700">FREE</Badge>
                    ) : (
                      <Badge variant="outline">
                        {reward.cost} points
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {reward.shortDescription}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {reward.isNew && <Badge className="bg-green-500 text-white text-xs">NEW</Badge>}
                  {reward.isPopular && <Badge className="bg-orange-500 text-white text-xs">POPULAR</Badge>}
                  {reward.isExclusive && <Badge className="bg-purple-500 text-white text-xs">EXCLUSIVE</Badge>}
                  {reward.isLimited && <Badge className="bg-red-500 text-white text-xs">LIMITED</Badge>}
                  {expiringSoon && <Badge className="bg-yellow-500 text-white text-xs">EXPIRING SOON</Badge>}
                </div>

                {/* Value */}
                {reward.originalValue && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-gray-500 line-through">
                      {reward.originalValue} EGP
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      Save {reward.originalValue - reward.cost} EGP
                    </span>
                  </div>
                )}

                {/* Limited Quantity */}
                {reward.remainingQuantity && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Available</span>
                      <span>{reward.remainingQuantity} left</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-red-500 h-1 rounded-full"
                        style={{ 
                          width: `${(reward.remainingQuantity / 10) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Expiry Date */}
                {reward.expiresAt && (
                  <p className="text-xs text-orange-600 mb-4">
                    Expires: {new Date(reward.expiresAt).toLocaleDateString()}
                  </p>
                )}

                {/* Tier Restriction */}
                {reward.tierRestriction && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Tier Required:</p>
                    <div className="flex gap-1">
                      {reward.tierRestriction.map((tier) => (
                        <Badge 
                          key={tier} 
                          variant={tier === currentTier ? "default" : "outline"}
                          className="text-xs"
                        >
                          {tier}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  className="w-full"
                  variant={canRedeemReward ? "default" : "outline"}
                  disabled={!canRedeemReward || !eligible}
                  onClick={() => onRedeemReward(reward.id)}
                >
                  {!eligible ? 'Tier Required' : 
                   !canRedeemReward ? 'Insufficient Points' :
                   'Redeem Now'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredRewards.length === 0 && (
        <Card className="p-12 text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rewards Found</h3>
          <p className="text-gray-600">Try adjusting your search or filters to find more rewards.</p>
        </Card>
      )}
    </div>
  );
};