import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Associations | KonBase',
  description: 'Manage your associations and organizations',
};

export default function AssociationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
