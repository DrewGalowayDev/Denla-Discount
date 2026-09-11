const { query, queryOne } = require('../config/database');

/**
 * Build WHERE clause from filter object
 * @param {Object} filters - Key-value pairs for filtering
 * @returns {Object} { whereClause, values }
 */
const buildWhereClause = (filters) => {
    const conditions = [];
    const values = [];
    
    Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
            conditions.push(`${key} = ?`);
            values.push(filters[key]);
        }
    });
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values };
};

/**
 * Build pagination clause
 * @param {Number} page - Page number (1-indexed)
 * @param {Number} limit - Items per page
 * @returns {Object} { limitClause, offset }
 */
const buildPaginationClause = (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const limitClause = `LIMIT ${limit} OFFSET ${offset}`;
    return { limitClause, offset };
};

/**
 * Build ORDER BY clause
 * @param {String} sortBy - Column to sort by
 * @param {String} sortOrder - 'ASC' or 'DESC'
 * @returns {String} ORDER BY clause
 */
const buildOrderByClause = (sortBy = 'created_at', sortOrder = 'DESC') => {
    const validOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return `ORDER BY ${sortBy} ${validOrder}`;
};

/**
 * Get paginated results with total count
 * @param {String} table - Table name
 * @param {Object} options - { filters, page, limit, sortBy, sortOrder }
 * @returns {Object} { data, pagination }
 */
const getPaginated = async (table, options = {}) => {
    const { filters = {}, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    
    const { whereClause, values } = buildWhereClause(filters);
    const { limitClause } = buildPaginationClause(page, limit);
    const orderByClause = buildOrderByClause(sortBy, sortOrder);
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
    const countResult = await queryOne(countSql, values);
    const total = countResult.total;
    
    // Get paginated data
    const dataSql = `SELECT * FROM ${table} ${whereClause} ${orderByClause} ${limitClause}`;
    const data = await query(dataSql, values);
    
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        }
    };
};

/**
 * Find one record by ID
 * @param {String} table - Table name
 * @param {String} id - Record ID
 * @returns {Object|null} Record or null
 */
const findById = async (table, id) => {
    const sql = `SELECT * FROM ${table} WHERE id = ? LIMIT 1`;
    return await queryOne(sql, [id]);
};

/**
 * Find one record by field
 * @param {String} table - Table name
 * @param {String} field - Field name
 * @param {*} value - Field value
 * @returns {Object|null} Record or null
 */
const findByField = async (table, field, value) => {
    const sql = `SELECT * FROM ${table} WHERE ${field} = ? LIMIT 1`;
    return await queryOne(sql, [value]);
};

/**
 * Check if record exists
 * @param {String} table - Table name
 * @param {String} field - Field name
 * @param {*} value - Field value
 * @returns {Boolean} True if exists
 */
const exists = async (table, field, value) => {
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${field} = ?`;
    const result = await queryOne(sql, [value]);
    return result.count > 0;
};

/**
 * Insert record and return inserted ID
 * @param {String} table - Table name
 * @param {Object} data - Data to insert
 * @returns {String} Inserted ID
 */
const insert = async (table, data) => {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    return result.insertId || data.id;
};

/**
 * Update record by ID
 * @param {String} table - Table name
 * @param {String} id - Record ID
 * @param {Object} data - Data to update
 * @returns {Boolean} True if updated
 */
const updateById = async (table, id, data) => {
    const fields = Object.keys(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    const result = await query(sql, values);
    
    return result.affectedRows > 0;
};

/**
 * Delete record by ID
 * @param {String} table - Table name
 * @param {String} id - Record ID
 * @returns {Boolean} True if deleted
 */
const deleteById = async (table, id) => {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
};

/**
 * Soft delete (set is_active = false)
 * @param {String} table - Table name
 * @param {String} id - Record ID
 * @returns {Boolean} True if deleted
 */
const softDelete = async (table, id) => {
    return await updateById(table, id, { is_active: false });
};

/**
 * Count records with filters
 * @param {String} table - Table name
 * @param {Object} filters - Filter conditions
 * @returns {Number} Count
 */
const count = async (table, filters = {}) => {
    const { whereClause, values } = buildWhereClause(filters);
    const sql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
    const result = await queryOne(sql, values);
    return result.count;
};

/**
 * Execute raw SQL query (use with caution)
 * @param {String} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Array} Query results
 */
const rawQuery = async (sql, params = []) => {
    return await query(sql, params);
};

/**
 * Bulk insert multiple records
 * @param {String} table - Table name
 * @param {Array} records - Array of objects to insert
 * @returns {Boolean} True if inserted
 */
const bulkInsert = async (table, records) => {
    if (!records || records.length === 0) return false;
    
    const fields = Object.keys(records[0]);
    const placeholders = records.map(() => `(${fields.map(() => '?').join(', ')})`).join(', ');
    const values = records.flatMap(record => Object.values(record));
    
    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES ${placeholders}`;
    const result = await query(sql, values);
    
    return result.affectedRows > 0;
};

module.exports = {
    buildWhereClause,
    buildPaginationClause,
    buildOrderByClause,
    getPaginated,
    findById,
    findByField,
    exists,
    insert,
    updateById,
    deleteById,
    softDelete,
    count,
    rawQuery,
    bulkInsert
};
