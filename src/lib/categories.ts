import {
  Wrench,
  Zap,
  SprayCan,
  Microwave,
  Bug,
  Store,
  ShoppingCart,
  ShoppingBasket,
  Code,
  Server,
  Briefcase,
  Scale,
  Calculator,
  Users,
  Megaphone,
  Stethoscope,
  Scissors,
  Dumbbell,
  Home,
  Building,
  Paintbrush2,
  Leaf,
  PaintRoller,
  Truck,
  type LucideIcon
} from 'lucide-react';

export interface BusinessCategory {
  name: string;
  icon: LucideIcon;
}

export const businessCategories: BusinessCategory[] = [
  { name: 'Construction & Contracting', icon: Wrench },
  { name: 'Electrical & Plumbing', icon: Zap },
  { name: 'Cleaning Services', icon: SprayCan },
  { name: 'Appliance Repair', icon: Microwave },
  { name: 'Pest Control', icon: Bug },
  { name: 'Retail Stores', icon: Store },
  { name: 'E-commerce & Online', icon: ShoppingCart },
  { name: 'Grocery & Convenience', icon: ShoppingBasket },
  { name: 'Web & App Development', icon: Code },
  { name: 'IT Support & Services', icon: Server },
  { name: 'Freelancers & Consultants', icon: Briefcase },
  { name: 'Legal Services', icon: Scale },
  { name: 'Accounting & Bookkeeping', icon: Calculator },
  { name: 'HR & Recruitment', icon: Users },
  { name: 'Marketing & Consulting', icon: Megaphone },
  { name: 'Clinics & Private Practices', icon: Stethoscope },
  { name: 'Salons & Spas', icon: Scissors },
  { name: 'Fitness & Wellness', icon: Dumbbell },
  { name: 'Real Estate Agents', icon: Home },
  { name: 'Property Management', icon: Building },
  { name: 'Interior Designers', icon: Paintbrush2 },
  { name: 'Landscaping Services', icon: Leaf },
  { name: 'Painting & Renovation', icon: PaintRoller },
  { name: 'Courier & Delivery', icon: Truck },
];
