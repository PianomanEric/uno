/*

Reference:
    Replacements
        Notes:
            Sequelize Replacements (Raw queries with inputs)
        Reference:
            https://sequelize.org/docs/v6/core-concepts/raw-queries/#replacements

    Bind
        Notes:
            "Bind parameters are like replacements. Except replacements are escaped and inserted into the query by
            sequelize before the query is sent to the database, while bind parameters are sent to the database
            outside the SQL query text.

            Only SQLite and PostgreSQL support bind parameters. Other dialects will insert them into the SQL query
            in the same way it is done for replacements. Bind parameters are referred to by either $1, $2, ... (numeric)
            or $key (alpha-numeric). This is independent of the dialect.
            "

            So it's safer than replacements
        Reference:
            https://sequelize.org/docs/v6/core-concepts/raw-queries/#bind-parameter

    Sequelize Tutorial: Episode 9 - SQL Injection and Raw Queries
        Notes:
            More raw query examples

        Reference:
            https://www.youtube.com/watch?v=jtVk2iUytGE

 */

// FIXME: SHOULD WE PROPAGATE ERROR OR NO?
// FIXME: INCONSISTENCY IN NAMING AND IN DB RAW QUERY WRITER

const dbEngine = {};

// const { mergeDefaults } = require("sequelize/types/utils");
const { sequelize } = require('../models');
const db = require('../db/index');
const debugPrinter = require('../util/debug_printer');

// const { QueryTypes } = require('sequelize');

async function sequelizeGetUsers() {
    const [results, metadata] = await sequelize.query('SELECT * FROM "User"');

    return results;
}

dbEngine.sequelizeGetUsers = sequelizeGetUsers;

/* #################################################################################################### */

async function getUserAndUserStatisticsByUsername(username) {
    debugPrinter.printFunction(getUserAndUserStatisticsByUsername.name);

    const result = await db.any(
        `
        SELECT * 
        FROM public."User" AS "user"
        LEFT JOIN "UserStatistic" AS "statistics" 
        ON "user".user_id="statistics".statistic_id
        WHERE "user".username = $1; 
        `,
        [
            username,
        ],
    );

    return result[0];
}

dbEngine.getUserAndUserStatisticsByUsername = getUserAndUserStatisticsByUsername;

/**
 * Example output:
 *      [ { username: 'joseph1', password: 'sdfsd', account_id: 8 } ]
 *
 * @param username
 * @returns {Promise<any>}
 */
async function getUserByUsername(username) {
    debugPrinter.printFunction(getUserByUsername.name);

    const result = await db.any(
        `
        SELECT *
        FROM "User" AS "user" 
        WHERE "user".username = $1;
        `,
        [
            username,
        ],
    );

    return result[0]; // Should be an object returned
}

dbEngine.getUserByUsername = getUserByUsername;

/**
 *
 * @param username
 * @param password
 * @param display_name
 * @returns {Promise<any[]>}
 */
async function createUser(username, password, display_name) {
    debugPrinter.printFunction(createUser.name);
    const result = await db.any(
        `
        INSERT INTO "User" (username, password, display_name)
        VALUES ($1, $2, $3)
        RETURNING *;
        `,
        [
            username,
            password,
            display_name,
        ],
    );

    return result[0]; // Should be the new object
}

dbEngine.createUser = createUser;

/**
 * Create account statistic given user_id, will return statistic_id
 *
 * @param user_id
 * @returns {Promise<any[]>}
 */
async function createUserStatistic(user_id) {
    debugPrinter.printFunction(createUserStatistic.name);
    const result = await db.any(
        `
        INSERT INTO "UserStatistic" (user_id, num_wins, num_loss)
        VALUES ($1, 0, 0)
        RETURNING *;
        `,
        [
            user_id,
        ],
    );

    return result[0]; // Should be the new object
}

dbEngine.createUserStatistic = createUserStatistic;

module.exports = dbEngine;
