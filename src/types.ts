export type UserRole = 'client' | 'professional';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  location?: string;
  phone?: string;
  activities?: { title: string, status: string, price: string, professionalId?: string, date?: string }[];
}

export interface Client extends User {
  role: 'client';
}

export interface Professional extends User {
  role: 'professional';
  workerType: 'professional' | 'autonomous';
  specialty: string;
  rating: number;
  reviewsCount: number;
  completedServices: number;
  yearsExp: number;
  responseTime: string;
  portfolio: PortfolioItem[];
  bio: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  imageUrl: string;
  type?: 'image' | 'video';
  caption?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isImage?: boolean;
}

export interface Chat {
  id: string;
  participant: User;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  online?: boolean;
  messages: Message[];
}

export interface Review {
  id: string;
  professionalId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

export type View =
  | 'splash'
  | 'role_selection'
  | 'login'
  | 'register'
  | 'client_home'
  | 'professional_home'
  | 'search'
  | 'pro_profile'
  | 'messages'
  | 'chat_room'
  | 'edit_profile'
  | 'edit_schedule'
  | 'manage_portfolio'
  | 'booking'
  | 'complete_profile'
  | 'client_profile'
  | 'professional_reviews'
  | 'review_submission';
