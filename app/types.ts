export interface DemoVideo {
  id: string;
  content_url: string;
  created_at: string;
  publicUrl?: string;
  isLoading?: boolean;
  uploadProgress?: number;
}

export interface OutputVideo {
  id: string;
  url: string;
  created_at: string;
  status: string;
  user_id: string;
}

export interface App {
  id: string;
  app_name: string;
  app_logo_url: string;
}
