#!/usr/bin/env node

/**
 * Generate Database Schema Dump
 * Creates a comprehensive schema dump with tables, columns, indexes, and constraints
 */

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Reebo@2004',
    database: process.env.DB_NAME || 'gemini_crm',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging
});

// Get complete schema information
async function getCompleteSchema() {
  const schema = {
    database: dbConfig.database,
    environment: env,
    timestamp: new Date().toISOString(),
    tables: {},
    indexes: [],
    constraints: [],
    sequences: []
  };

  try {
    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT 
        table_name,
        table_type,
        table_comment
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    // Get detailed information for each table
    for (const table of tables) {
      const tableName = table.table_name;
      
      // Get columns
      const [columns] = await sequelize.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default,
          ordinal_position,
          udt_name
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);

      // Get primary keys
      const [primaryKeys] = await sequelize.query(`
        SELECT 
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = '${tableName}'
        AND tc.constraint_type = 'PRIMARY KEY';
      `);

      // Get foreign keys
      const [foreignKeys] = await sequelize.query(`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = '${tableName}'
        AND tc.constraint_type = 'FOREIGN KEY';
      `);

      // Get unique constraints
      const [uniqueConstraints] = await sequelize.query(`
        SELECT 
          tc.constraint_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = '${tableName}'
        AND tc.constraint_type = 'UNIQUE';
      `);

      // Get check constraints
      const [checkConstraints] = await sequelize.query(`
        SELECT 
          tc.constraint_name,
          cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc 
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = '${tableName}'
        AND tc.constraint_type = 'CHECK';
      `);

      schema.tables[tableName] = {
        name: tableName,
        type: table.table_type,
        comment: table.table_comment,
        columns: columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          udtName: col.udt_name,
          maxLength: col.character_maximum_length,
          precision: col.numeric_precision,
          scale: col.numeric_scale,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          position: col.ordinal_position
        })),
        primaryKeys: primaryKeys.map(pk => pk.column_name),
        foreignKeys: foreignKeys.map(fk => ({
          column: fk.column_name,
          referencedTable: fk.foreign_table_name,
          referencedColumn: fk.foreign_column_name,
          constraintName: fk.constraint_name
        })),
        uniqueConstraints: uniqueConstraints.reduce((acc, uc) => {
          if (!acc[uc.constraint_name]) {
            acc[uc.constraint_name] = [];
          }
          acc[uc.constraint_name].push(uc.column_name);
          return acc;
        }, {}),
        checkConstraints: checkConstraints.map(cc => ({
          name: cc.constraint_name,
          clause: cc.check_clause
        }))
      };
    }

    // Get all indexes
    const [indexes] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);

    schema.indexes = indexes.map(idx => ({
      schema: idx.schemaname,
      table: idx.tablename,
      name: idx.indexname,
      definition: idx.indexdef
    }));

    // Get sequences
    const [sequences] = await sequelize.query(`
      SELECT 
        sequence_name,
        data_type,
        numeric_precision,
        numeric_scale,
        start_value,
        minimum_value,
        maximum_value,
        increment
      FROM information_schema.sequences
      WHERE sequence_schema = 'public';
    `);

    schema.sequences = sequences.map(seq => ({
      name: seq.sequence_name,
      dataType: seq.data_type,
      precision: seq.numeric_precision,
      scale: seq.numeric_scale,
      startValue: seq.start_value,
      minValue: seq.minimum_value,
      maxValue: seq.maximum_value,
      increment: seq.increment
    }));

    return schema;

  } catch (error) {
    console.error('Error generating schema:', error);
    throw error;
  }
}

// Generate schema dump files
async function generateSchemaDump() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    console.log('📊 Generating schema dump...');
    const schema = await getCompleteSchema();

    // Create output directory
    const outputDir = path.join(__dirname, '../docs/schema');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate JSON schema dump
    const jsonFile = path.join(outputDir, `schema-${env}-${Date.now()}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(schema, null, 2));
    console.log(`✅ JSON schema dump saved: ${jsonFile}`);

    // Generate human-readable schema documentation
    const mdFile = path.join(outputDir, `schema-${env}-${Date.now()}.md`);
    const markdown = generateMarkdownSchema(schema);
    fs.writeFileSync(mdFile, markdown);
    console.log(`✅ Markdown schema documentation saved: ${mdFile}`);

    // Generate SQL schema dump
    const sqlFile = path.join(outputDir, `schema-${env}-${Date.now()}.sql`);
    const sql = await generateSQLSchema();
    fs.writeFileSync(sqlFile, sql);
    console.log(`✅ SQL schema dump saved: ${sqlFile}`);

    console.log('\n🎉 Schema dump generation complete!');
    console.log(`📁 Files saved in: ${outputDir}`);

  } catch (error) {
    console.error('❌ Schema dump generation failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Generate markdown documentation
function generateMarkdownSchema(schema) {
  let md = `# Database Schema Documentation\n\n`;
  md += `**Database:** ${schema.database}\n`;
  md += `**Environment:** ${schema.environment}\n`;
  md += `**Generated:** ${schema.timestamp}\n\n`;

  md += `## Tables\n\n`;

  Object.values(schema.tables).forEach(table => {
    md += `### ${table.name}\n\n`;
    
    if (table.comment) {
      md += `${table.comment}\n\n`;
    }

    md += `| Column | Type | Nullable | Default | Notes |\n`;
    md += `|--------|------|----------|---------|-------|\n`;

    table.columns.forEach(col => {
      const type = col.maxLength ? `${col.type}(${col.maxLength})` : col.type;
      const nullable = col.nullable ? 'Yes' : 'No';
      const defaultVal = col.default || '-';
      const notes = [];
      
      if (table.primaryKeys.includes(col.name)) {
        notes.push('PK');
      }
      
      const fk = table.foreignKeys.find(fk => fk.column === col.name);
      if (fk) {
        notes.push(`FK → ${fk.referencedTable}.${fk.referencedColumn}`);
      }

      md += `| ${col.name} | ${type} | ${nullable} | ${defaultVal} | ${notes.join(', ')} |\n`;
    });

    md += `\n`;

    if (Object.keys(table.uniqueConstraints).length > 0) {
      md += `**Unique Constraints:**\n`;
      Object.entries(table.uniqueConstraints).forEach(([name, columns]) => {
        md += `- ${name}: (${columns.join(', ')})\n`;
      });
      md += `\n`;
    }

    if (table.checkConstraints.length > 0) {
      md += `**Check Constraints:**\n`;
      table.checkConstraints.forEach(cc => {
        md += `- ${cc.name}: ${cc.clause}\n`;
      });
      md += `\n`;
    }
  });

  md += `## Indexes\n\n`;
  md += `| Table | Index Name | Definition |\n`;
  md += `|-------|------------|------------|\n`;

  schema.indexes.forEach(idx => {
    md += `| ${idx.table} | ${idx.name} | ${idx.definition} |\n`;
  });

  return md;
}

// Generate SQL schema dump
async function generateSQLSchema() {
  try {
    const [result] = await sequelize.query(`
      SELECT 
        'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
        array_to_string(
          array_agg(
            column_name || ' ' || type || 
            case when not_null then ' NOT NULL' else '' end
          ), ', '
        ) || ');' as ddl
      FROM (
        SELECT 
          schemaname, tablename, column_name, type, not_null
        FROM (
          SELECT 
            t.schemaname,
            t.tablename,
            a.attname as column_name,
            pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
            a.attnotnull as not_null
          FROM 
            pg_catalog.pg_attribute a
            JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
            JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
            JOIN pg_tables t ON c.relname = t.tablename AND n.nspname = t.schemaname
          WHERE 
            a.attnum > 0 
            AND NOT a.attisdropped
            AND t.schemaname = 'public'
          ORDER BY a.attnum
        ) as columns
      ) as table_columns
      GROUP BY schemaname, tablename
      ORDER BY tablename;
    `);

    return result.map(row => row.ddl).join('\n\n');
  } catch (error) {
    console.error('Error generating SQL schema:', error);
    return '-- Error generating SQL schema';
  }
}

// Run if called directly
if (require.main === module) {
  generateSchemaDump();
}

module.exports = {
  generateSchemaDump,
  getCompleteSchema
};
