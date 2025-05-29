exports.up = function(knex) {
    return Promise.all([
      // Users table
      knex.schema.createTable('users', (table) => {
        table.uuid('id').primary();
        table.string('username', 50).notNullable().unique();
        table.string('email', 100).notNullable().unique();
        table.string('password', 100).notNullable();
        table.boolean('mfa_enabled').defaultTo(false);
        table.string('mfa_secret', 100).nullable();
        table.timestamps(true, true);
      }),
      
      // Channels table
      knex.schema.createTable('channels', (table) => {
        table.uuid('id').primary();
        table.string('name', 100).notNullable();
        table.text('description').nullable();
        table.enum('type', ['direct', 'group', 'slack', 'discord']).defaultTo('group');
        table.string('external_id', 100).nullable();
        table.timestamps(true, true);
      }),
      
      // Channel users (membership) table
      knex.schema.createTable('channel_users', (table) => {
        table.uuid('id').primary();
        table.uuid('channel_id').notNullable();
        table.uuid('user_id').notNullable();
        table.enum('role', ['owner', 'admin', 'member']).defaultTo('member');
        table.timestamps(true, true);
        
        table.foreign('channel_id').references('id').inTable('channels').onDelete('CASCADE');
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.unique(['channel_id', 'user_id']);
      }),
      
      // Messages table
      knex.schema.createTable('messages', (table) => {
        table.uuid('id').primary();
        table.uuid('channel_id').notNullable();
        table.uuid('user_id').notNullable();
        table.text('content').notNullable();
        table.boolean('encrypted').defaultTo(true);
        table.timestamp('sent_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        
        table.foreign('channel_id').references('id').inTable('channels').onDelete('CASCADE');
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      }),
      
      // Attachments table
      knex.schema.createTable('attachments', (table) => {
        table.uuid('id').primary();
        table.uuid('message_id').notNullable();
        table.string('file_name', 255).notNullable();
        table.string('file_type', 100).notNullable();
        table.string('file_path', 255).notNullable();
        table.boolean('encrypted').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        
        table.foreign('message_id').references('id').inTable('messages').onDelete('CASCADE');
      }),
      
      // Sessions table
      knex.schema.createTable('sessions', (table) => {
        table.uuid('id').primary();
        table.uuid('user_id').notNullable();
        table.string('token', 255).notNullable();
        table.timestamp('expires_at').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      }),
      
      // Audit logs table
      knex.schema.createTable('audit_logs', (table) => {
        table.uuid('id').primary();
        table.uuid('user_id').nullable();
        table.string('action', 100).notNullable();
        table.string('resource_type', 50).nullable();
        table.string('resource_id', 36).nullable();
        table.string('ip_address', 45).nullable();
        table.text('details').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        
        table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
      })
    ]);
};

exports.down = function(knex) {
    return Promise.all([
      knex.schema.dropTableIfExists('audit_logs'),
      knex.schema.dropTableIfExists('sessions'),
      knex.schema.dropTableIfExists('attachments'),
      knex.schema.dropTableIfExists('messages'),
      knex.schema.dropTableIfExists('channel_users'),
      knex.schema.dropTableIfExists('channels'),
      knex.schema.dropTableIfExists('users')
    ]);
};