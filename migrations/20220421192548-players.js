module.exports = {
    async up(queryInterface, Sequelize) {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.DataTypes.INTEGER });
         */
        return queryInterface.createTable('Players', {

            // Tie the player to the game
            game_id: {
                type: Sequelize.DataTypes.INTEGER,
                references: {
                    model: 'Game',
                    key: 'game_id',
                },
                allowNull: false,
                unique: false, // False because multiple different players in 1 game
            },

            // Player in the game
            player_id: {
                type: Sequelize.DataTypes.INTEGER,
                references: {
                    model: 'Player',
                    key: 'player_id',
                },
                allowNull: false,
                unique: true, // Can't have a player in different as well as in the same game multiple times
            },

            // Is the player the host of the game
            is_host: {
                type: Sequelize.DataTypes.BOOLEAN,
                defaultValue: false,
                unique: false,
            },

            // Is the player currently playing the game or is out of the game
            in_game: {
                type: Sequelize.DataTypes.BOOLEAN,
                defaultValue: false,
                unique: false,
            },

            // SEAT ORDER IS IMPLIED
            // seat_index: {
            //     type: Sequelize.DataTypes.INTEGER,
            //     allowNull: false,
            // },
        });
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        return queryInterface.dropTable('Players');
    },
};
