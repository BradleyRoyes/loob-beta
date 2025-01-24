export interface Node {
  id: string;
  lat: number | null;
  lon: number | null;
  label: string;
  type: string;
  details: string;
  contact: string;
  visualType: "Today";
  createdAt: string;
  updatedAt: string;
} 