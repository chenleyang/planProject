export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: Blob | string; // Blob for IndexedDB, base64 for fallback/export
  createdAt: number;
}

export interface Reminder {
  enabled: boolean;
  time: string; // HH:mm
  repeat: 'once' | 'daily' | 'weekly' | 'weekdays';
  lastNotified?: number;
}

export interface ProgressBlock {
  id: string;
  type: 'text' | 'image';
  content: string; // Markdown text or Base64 image
}

export interface Plan {
  id: string;
  title: string;
  content: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  isCompleted: boolean;
  completedAt?: number;
  reminder?: Reminder;
  attachments: Attachment[];
  progressBlocks?: ProgressBlock[];
  createdAt: number;
  updatedAt: number;
}

export interface ImportConfig {
  format: 'csv' | 'txt';
  content: string;
}
