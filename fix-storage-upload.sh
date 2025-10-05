#!/bin/bash

# Script to apply the storage bucket migration to fix image upload issues
# This script will apply the migration to your remote Supabase instance

echo "Applying storage bucket migration to fix image upload issues..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if project is linked
if ! supabase status &> /dev/null; then
    echo "Error: Supabase project is not linked. Please link your project first:"
    echo "supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

# Apply the migration
echo "Applying migration: 20241201_create_item_images_storage_bucket.sql"
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo "The item-images storage bucket and RLS policies have been created."
    echo "You should now be able to upload images without the 'row violates row-level security policy' error."
else
    echo "❌ Migration failed. Please check the error messages above."
    echo "You may need to apply the migration manually through the Supabase Dashboard SQL Editor."
fi
