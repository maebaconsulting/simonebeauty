#!/bin/bash

cd "/Users/dan/Documents/SOFTWARE/myProjects/simone _v2.1/webclaude"

export PGPASSWORD='MoutBinam@007'
HOST='db.xpntvajwrjuvsqsmizzb.supabase.co'
DB='postgres'
USER='postgres'

echo "Starting Phase 1 migration application..."

for i in {00..14}; do
  migration_file="supabase/migrations/202501070000${i}_*.sql"
  
  # Find the file matching the pattern
  file=$(ls $migration_file 2>/dev/null | head -1)
  
  if [ -f "$file" ]; then
    echo "====================================="
    echo "Applying: $(basename $file)"
    echo "====================================="
    
    psql -h $HOST -U $USER -d $DB -f "$file"
    
    if [ $? -eq 0 ]; then
      echo "✅ Successfully applied $(basename $file)"
    else
      echo "❌ Error applying $(basename $file)"
      exit 1
    fi
    echo ""
  fi
done

echo "✅ All Phase 1 migrations applied successfully!"
