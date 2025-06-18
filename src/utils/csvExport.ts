import { supabase } from '@/lib/supabase';
/**
 * Escape special characters for CSV
 */
const escapeCSV = (text: string): string => {
  if (!text) return '';
  return text.replace(/"/g, '""');
};

/**
 * Convert data array to CSV format and trigger download
 * @param data Array of objects to convert to CSV
 * @param filename Filename without extension
 */
export const exportToCSV = (
  data: Record<string, any>[],
  filename: string,
): void => {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  let csvContent = headers.join(',') + '\n';

  // Add rows
  data.forEach((item) => {
    const row = headers.map((header) => {
      const value = item[header];
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        return `"${escapeCSV(value)}"`;
      } else if (typeof value === 'object') {
        return `"${escapeCSV(JSON.stringify(value))}"`;
      }
      return value;
    });
    csvContent += row.join(',') + '\n';
  });

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Convert association data to CSV format
 */
export const associationToCSV = async (
  associationId: string,
): Promise<string> => {
  try {
    // Fetch association data
    const { data: association, error: associationError } = await supabase
      .from('associations')
      .select('*')
      .eq('id', associationId)
      .single();

    if (associationError) throw associationError;

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('association_id', associationId);

    if (categoriesError) throw categoriesError;

    // Fetch locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('association_id', associationId);

    if (locationsError) throw locationsError;

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('association_id', associationId);

    if (itemsError) throw itemsError;

    // Create CSV content
    let csv = '';

    // Association info
    csv += 'ASSOCIATION\n';
    csv += 'id,name,description,contact_email,contact_phone,website,address\n';
    csv += `${association.id},"${escapeCSV(association.name)}","${escapeCSV(association.description || '')}",`;
    csv += `"${escapeCSV(association.contact_email)}","${escapeCSV(association.contact_phone || '')}",`;
    csv += `"${escapeCSV(association.website || '')}","${escapeCSV(association.address || '')}"\n\n`;

    // Categories
    csv += 'CATEGORIES\n';
    csv += 'id,name,description,parent_id\n';

    categories.forEach((cat) => {
      csv += `${cat.id},"${escapeCSV(cat.name)}","${escapeCSV(cat.description || '')}",${cat.parent_id || ''}\n`;
    });

    csv += '\n';

    // Locations
    csv += 'LOCATIONS\n';
    csv += 'id,name,description,parent_id,is_room\n';

    locations.forEach((loc) => {
      csv += `${loc.id},"${escapeCSV(loc.name)}","${escapeCSV(loc.description || '')}",`;
      csv += `${loc.parent_id || ''},${loc.is_room}\n`;
    });

    csv += '\n';

    // Items
    csv += 'ITEMS\n';
    csv +=
      'id,name,description,serial_number,barcode,condition,category_id,location_id,purchase_date,';
    csv +=
      'purchase_price,warranty_expiration,is_consumable,quantity,minimum_quantity,notes\n';

    items.forEach((item) => {
      csv += `${item.id},"${escapeCSV(item.name)}","${escapeCSV(item.description || '')}",`;
      csv += `"${escapeCSV(item.serial_number || '')}","${escapeCSV(item.barcode || '')}","${item.condition}",`;
      csv += `${item.category_id},${item.location_id},"${item.purchase_date || ''}",`;
      csv += `${item.purchase_price || ''},"${item.warranty_expiration || ''}",${item.is_consumable},`;
      csv += `${item.quantity || '1'},"${item.minimum_quantity || ''}","${escapeCSV(item.notes || '')}"\n`;
    });

    return csv;
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw error;
  }
};

/**
 * Parse CSV data for import
 */
export const parseCSVForImport = async (
  csvContent: string,
  associationId: string,
): Promise<{
  categories: Array<any>;
  locations: Array<any>;
  items: Array<any>;
  errors: Array<string>;
}> => {
  const lines = csvContent.split('\n');
  const result = {
    categories: [],
    locations: [],
    items: [],
    errors: [],
  };

  let currentSection = '';
  let headers: string[] = [];

  // Process CSV content line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Check if this is a section marker
    if (line === 'CATEGORIES' || line === 'LOCATIONS' || line === 'ITEMS') {
      currentSection = line;
      headers = []; // Reset headers for new section
      continue;
    }

    // Process headers line
    if (headers.length === 0 && currentSection) {
      headers = line.split(',').map((header) => header.trim());
      continue;
    }

    // Process data lines
    if (headers.length > 0 && currentSection) {
      try {
        // Parse CSV line into values
        const values = parseCSVLine(line);
        if (values.length !== headers.length) {
          result.errors.push(
            `Line ${i + 1}: Column count mismatch. Expected ${headers.length}, got ${values.length}`,
          );
          continue;
        }

        // Convert to object
        const entry: Record<string, any> = {};
        headers.forEach((header, index) => {
          entry[header] = values[index];
        });

        // Add association_id
        entry.association_id = associationId;

        // Process based on section
        switch (currentSection) {
          case 'CATEGORIES':
            result.categories.push(processCategoryEntry(entry));
            break;
          case 'LOCATIONS':
            result.locations.push(processLocationEntry(entry));
            break;
          case 'ITEMS':
            result.items.push(processItemEntry(entry));
            break;
        }
      } catch (error) {
        result.errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }
  }

  return result;
};

/**
 * Process a category entry for import
 */
const processCategoryEntry = (entry: Record<string, any>) => {
  return {
    name: entry.name,
    description: entry.description || null,
    parent_name: entry.parent_name || null,
    association_id: entry.association_id,
  };
};

/**
 * Process a location entry for import
 */
const processLocationEntry = (entry: Record<string, any>) => {
  return {
    name: entry.name,
    description: entry.description || null,
    parent_name: entry.parent_name || null,
    is_room: entry.is_room === 'TRUE',
    association_id: entry.association_id,
  };
};

/**
 * Process an item entry for import
 */
const processItemEntry = (entry: Record<string, any>) => {
  return {
    name: entry.name,
    description: entry.description || null,
    serial_number: entry.serial_number || null,
    barcode: entry.barcode || null,
    condition: entry.condition || 'good',
    category_name: entry.category_name,
    location_name: entry.location_name,
    purchase_date: entry.purchase_date || null,
    purchase_price: entry.purchase_price
      ? parseFloat(entry.purchase_price)
      : null,
    warranty_expiration: entry.warranty_expiration || null,
    is_consumable: entry.is_consumable === 'TRUE',
    quantity: entry.quantity ? parseInt(entry.quantity) : 1,
    minimum_quantity: entry.minimum_quantity
      ? parseInt(entry.minimum_quantity)
      : null,
    notes: entry.notes || null,
    association_id: entry.association_id,
  };
};

/**
 * Parse a CSV line respecting quotes
 */
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Handle escaped quotes (double quotes inside quoted string)
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  values.push(current);

  return values;
};

/**
 * Generate CSV template for association import
 */
export const generateCSVTemplate = (): string => {
  let template = '';

  // Categories template
  template += 'CATEGORIES\n';
  template += 'name,description,parent_name\n';
  template += 'Main Category,Description of main category,\n';
  template += 'Sub Category,Description of sub category,Main Category\n\n';

  // Locations template
  template += 'LOCATIONS\n';
  template += 'name,description,parent_name,is_room\n';
  template += 'Main Storage,Main storage area,,FALSE\n';
  template += 'Storage Room 1,First storage room,Main Storage,TRUE\n\n';

  // Items template
  template += 'ITEMS\n';
  template +=
    'name,description,serial_number,barcode,condition,category_name,location_name,';
  template +=
    'purchase_date,purchase_price,warranty_expiration,is_consumable,quantity,minimum_quantity,notes\n';
  template +=
    'Item Name,Item description,SN12345,BC12345,new,Main Category,Main Storage,';
  template += '2023-01-01,99.99,2025-01-01,FALSE,1,,,\n';
  template +=
    'Consumable Item,Consumable description,,,good,Sub Category,Storage Room 1,';
  template += '2023-01-01,19.99,,TRUE,100,20,Reorder when low\n';

  return template;
};

/**
 * Import data from parsed CSV
 */
export const importCSVData = async (
  data: { categories: any[]; locations: any[]; items: any[] },
  associationId: string,
): Promise<{
  success: boolean;
  errors: string[];
  stats: Record<string, number>;
}> => {
  const errors: string[] = [];
  const stats = {
    categoriesAdded: 0,
    locationsAdded: 0,
    itemsAdded: 0,
  };

  try {
    // Process categories first (to get IDs for items)
    const categoryMap = new Map<string, string>(); // name -> id

    for (const category of data.categories) {
      try {
        const { data: existingCategories } = await supabase
          .from('categories')
          .select('id')
          .eq('name', category.name)
          .eq('association_id', associationId);

        // Skip if category already exists
        if (existingCategories && existingCategories.length > 0) {
          categoryMap.set(category.name, existingCategories[0].id);
          continue;
        }

        // Find parent_id if parent_name is provided
        let parent_id = null;
        if (category.parent_name) {
          parent_id = categoryMap.get(category.parent_name);
          if (!parent_id) {
            // Parent category might not exist yet
            errors.push(
              `Parent category "${category.parent_name}" not found for "${category.name}"`,
            );
          }
        }

        // Insert category
        const { data: newCategory, error } = await supabase
          .from('categories')
          .insert({
            name: category.name,
            description: category.description,
            parent_id,
            association_id: associationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;

        // Store the ID for reference
        categoryMap.set(category.name, newCategory.id);
        stats.categoriesAdded++;
      } catch (error) {
        errors.push(
          `Error importing category "${category.name}": ${error.message}`,
        );
      }
    }

    // Process locations (to get IDs for items)
    const locationMap = new Map<string, string>(); // name -> id

    for (const location of data.locations) {
      try {
        const { data: existingLocations } = await supabase
          .from('locations')
          .select('id')
          .eq('name', location.name)
          .eq('association_id', associationId);

        // Skip if location already exists
        if (existingLocations && existingLocations.length > 0) {
          locationMap.set(location.name, existingLocations[0].id);
          continue;
        }

        // Find parent_id if parent_name is provided
        let parent_id = null;
        if (location.parent_name) {
          parent_id = locationMap.get(location.parent_name);
          if (!parent_id) {
            // Parent location might not exist yet
            errors.push(
              `Parent location "${location.parent_name}" not found for "${location.name}"`,
            );
          }
        }

        // Insert location
        const { data: newLocation, error } = await supabase
          .from('locations')
          .insert({
            name: location.name,
            description: location.description,
            parent_id,
            is_room: location.is_room,
            association_id: associationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;

        // Store the ID for reference
        locationMap.set(location.name, newLocation.id);
        stats.locationsAdded++;
      } catch (error) {
        errors.push(
          `Error importing location "${location.name}": ${error.message}`,
        );
      }
    }

    // Process items
    for (const item of data.items) {
      try {
        // Look up category_id from name
        const category_id = categoryMap.get(item.category_name);
        if (!category_id) {
          errors.push(
            `Category "${item.category_name}" not found for item "${item.name}"`,
          );
          continue;
        }

        // Look up location_id from name
        const location_id = locationMap.get(item.location_name);
        if (!location_id) {
          errors.push(
            `Location "${item.location_name}" not found for item "${item.name}"`,
          );
          continue;
        }

        // Check if item already exists
        const { data: existingItems } = await supabase
          .from('items')
          .select('id')
          .eq('name', item.name)
          .eq('association_id', associationId);

        if (existingItems && existingItems.length > 0) {
          errors.push(`Item "${item.name}" already exists, skipping.`);
          continue;
        }

        // Insert item
        const { error } = await supabase.from('items').insert({
          name: item.name,
          description: item.description,
          serial_number: item.serial_number,
          barcode: item.barcode,
          condition: item.condition,
          category_id,
          location_id,
          purchase_date: item.purchase_date,
          purchase_price: item.purchase_price,
          warranty_expiration: item.warranty_expiration,
          is_consumable: item.is_consumable,
          quantity: item.quantity,
          minimum_quantity: item.minimum_quantity,
          notes: item.notes,
          association_id: associationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        stats.itemsAdded++;
      } catch (error) {
        errors.push(`Error importing item "${item.name}": ${error.message}`);
      }
    }

    return { success: true, errors, stats };
  } catch (error) {
    errors.push(`General import error: ${error.message}`);
    return { success: false, errors, stats };
  }
};
