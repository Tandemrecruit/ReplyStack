import { Sidebar } from '@/components/layout';

/**
 * Layout wrapper that renders the dashboard sidebar and page content.
 *
 * @param children - Content to display in the main area to the right of the sidebar.
 * @returns A React element containing the Sidebar and the `children` within the main content area.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="pl-64">{children}</main>
    </div>
  );
}