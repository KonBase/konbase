export interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  user_id: string;
  created_at: string;
}
