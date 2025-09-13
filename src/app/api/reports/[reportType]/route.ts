import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import DataAccessLayer, { createDataAccessLayer } from '@/lib/db/data-access';

// GET /api/reports/[reportType] - Get report data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = createDataAccessLayer();

    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const { reportType } = await params;

    let data;

    switch (reportType) {
      case 'inventory-summary':
        data = await getInventorySummary(associationId, dataAccess);
        break;
      case 'convention-usage':
        data = await getConventionUsage(associationId, days, dataAccess);
        break;
      case 'maintenance-alerts':
        data = await getMaintenanceAlerts(associationId, dataAccess);
        break;
      case 'user-activity':
        data = await getUserActivity(associationId, days, dataAccess);
        break;
      case 'financial-summary':
        data = await getFinancialSummary(associationId, dataAccess);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', success: false },
      { status: 500 }
    );
  }
}

async function getInventorySummary(
  associationId: string,
  dataAccess: DataAccessLayer
) {
  const [conditionBreakdown, categoryBreakdown, totalItems] = await Promise.all(
    [
      // Items by condition
      dataAccess.executeQuery<{ name: string; value: number }>(
        `
      SELECT condition as name, COUNT(*) as value
      FROM items
      WHERE association_id = $1
      GROUP BY condition
    `,
        [associationId]
      ),

      // Items by category
      dataAccess.executeQuery<{ name: string; count: number }>(
        `
      SELECT c.name, COUNT(i.id) as count
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id AND i.association_id = $1
      WHERE c.association_id = $1
      GROUP BY c.id, c.name
    `,
        [associationId]
      ),

      // Total items
      dataAccess.executeQuerySingle<{ total: number }>(
        `
      SELECT COUNT(*) as total
      FROM items
      WHERE association_id = $1
    `,
        [associationId]
      ),
    ]
  );

  return {
    conditionBreakdown: conditionBreakdown || [],
    categoryBreakdown: categoryBreakdown || [],
    totalItems: totalItems?.total || 0,
  };
}

async function getConventionUsage(
  associationId: string,
  days: number,
  dataAccess: DataAccessLayer
) {
  const usageOverTime = await dataAccess.executeQuery<{
    date: string;
    itemsUsed: number;
  }>(
    `
    SELECT 
      DATE(c.start_date) as date,
      COUNT(ce.id) as itemsUsed
    FROM conventions c
    LEFT JOIN convention_equipment ce ON c.id = ce.convention_id
    WHERE c.association_id = $1
      AND c.start_date >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(c.start_date)
    ORDER BY DATE(c.start_date)
  `,
    [associationId]
  );

  return {
    usageOverTime: usageOverTime || [],
  };
}

async function getMaintenanceAlerts(
  associationId: string,
  dataAccess: DataAccessLayer
) {
  type MaintenanceAlert = {
    itemName: string;
    condition: string;
    issue: string;
    priority: 'high' | 'medium' | 'low' | 'none';
  };

  const alerts = await dataAccess.executeQuery<MaintenanceAlert>(
    `
    SELECT 
      i.name as itemName,
      i.condition,
      CASE 
        WHEN i.condition = 'broken' THEN 'Item is broken and needs repair'
        WHEN i.condition = 'poor' THEN 'Item is in poor condition and needs attention'
        WHEN i.warranty_expires < NOW() THEN 'Warranty has expired'
        WHEN i.warranty_expires < NOW() + INTERVAL '30 days' THEN 'Warranty expires soon'
        ELSE 'No issues'
      END as issue,
      CASE 
        WHEN i.condition = 'broken' THEN 'high'
        WHEN i.condition = 'poor' THEN 'medium'
        WHEN i.warranty_expires < NOW() + INTERVAL '30 days' THEN 'low'
        ELSE 'none'
      END as priority
    FROM items i
    WHERE i.association_id = $1
      AND (
        i.condition IN ('broken', 'poor')
        OR i.warranty_expires < NOW() + INTERVAL '30 days'
      )
    ORDER BY 
      CASE 
        WHEN i.condition = 'broken' THEN 1
        WHEN i.condition = 'poor' THEN 2
        WHEN i.warranty_expires < NOW() THEN 3
        ELSE 4
      END
  `,
    [associationId]
  );

  return {
    alerts: (alerts || []).filter(alert => alert.priority !== 'none'),
  };
}

async function getUserActivity(
  associationId: string,
  days: number,
  dataAccess: DataAccessLayer
) {
  const activity = await dataAccess.executeQuery<{
    date: string;
    actions: number;
  }>(
    `
    SELECT 
      DATE(al.created_at) as date,
      COUNT(*) as actions
    FROM audit_logs al
    WHERE al.association_id = $1
      AND al.created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(al.created_at)
    ORDER BY DATE(al.created_at)
  `,
    [associationId]
  );

  return {
    activity: activity || [],
  };
}

async function getFinancialSummary(
  associationId: string,
  dataAccess: DataAccessLayer
) {
  const [totalValue, avgValue, topCategories] = await Promise.all([
    // Total inventory value
    dataAccess.executeQuerySingle<{ total: number }>(
      `
      SELECT COALESCE(SUM(purchase_price), 0) as total
      FROM items
      WHERE association_id = $1
        AND purchase_price IS NOT NULL
    `,
      [associationId]
    ),

    // Average item value
    dataAccess.executeQuerySingle<{ average: number }>(
      `
      SELECT COALESCE(AVG(purchase_price), 0) as average
      FROM items
      WHERE association_id = $1
        AND purchase_price IS NOT NULL
    `,
      [associationId]
    ),

    // Top categories by value
    dataAccess.executeQuery<{
      name: string;
      value: number;
    }>(
      `
      SELECT 
        c.name,
        COALESCE(SUM(i.purchase_price), 0) as value
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id AND i.association_id = $1
      WHERE c.association_id = $1
      GROUP BY c.id, c.name
      ORDER BY value DESC
      LIMIT 10
    `,
      [associationId]
    ),
  ]);

  return {
    totalValue: totalValue?.total || 0,
    averageValue: avgValue?.average || 0,
    topCategories: topCategories || [],
  };
}
