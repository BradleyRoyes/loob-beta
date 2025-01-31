export interface LoobricateData {
  _id: string;
  name: string;
  description: string;
  addressLine1: string;
  city: string;
  adminUsername: string;
  tags: string[];
  admins: string[];
  members: string[];
  createdAt: string;
  type?: string;
  address?: string;
} 