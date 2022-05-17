class Draggable {
    constructor(element, containers, boundary) {
        this.dragging = false;
        this.containers = containers;
        this.parent = element.parentElement;
        this.childIndex = 0;
        this.element = element;
        this.dragBeginCallback = null;
        this.dragEndCallback = null;
        this.boundary = boundary;
        // Some hacky way to implement adding and removing listeners
        this.dragMouseDown = this.dragMouseDown.bind(this);
        this.dragMouseMove = this.dragMouseMove.bind(this);
        this.dragMouseUp = this.dragMouseUp.bind(this);

        this.element.addEventListener("mousedown", this.dragMouseDown);
        // this.element.onmousedown = this.dragMouseDown;
    }

    moveToPosition(x, y) {
        const computedStyle = window.getComputedStyle(this.element);
        const offsetX =
            -parseInt(computedStyle.width, 10) / 2 -
            parseInt(computedStyle.marginLeft, 10);
        const offsetY =
            -parseInt(computedStyle.height, 10) / 2 -
            parseInt(computedStyle.marginTop, 10);

        let posX = x + offsetX;
        let posY = y + offsetY;

        if (this.boundary) {
            const boundaryRect = this.boundary.getBoundingClientRect();
            if (posX < boundaryRect.left + window.scrollX) {
                posX = boundaryRect.left + window.scrollX;
            } else if (posX > boundaryRect.right + window.scrollX + 2 * offsetX) {
                posX = boundaryRect.right + window.scrollX + 2 * offsetX;
            }
            if (posY < boundaryRect.top + window.scrollY) {
                posY = boundaryRect.to + window.scrollY;
            } else if (posY > boundaryRect.bottom + window.scrollY + 2 * offsetY) {
                posY = boundaryRect.bottom + window.scrollY + 2 * offsetY;
            }
        }

        this.element.style.left = `${posX}px`;
        this.element.style.top = `${posY}px`;
    }

    dragMouseDown(event) {
        // If not left click, do nothing
        if (event.which != 1) {
            return;
        }
        if (this.dragging) {
            return;
        }
        if (this.element.getAttribute("disabled") !== null) {
            return;
        }

        this.dragging = true;

        event.preventDefault();

        document.addEventListener("mouseup", this.dragMouseUp);
        document.addEventListener("mousemove", this.dragMouseMove);

        this.parent = this.element.parentElement;
        this.childIndex = Array.from(this.parent.children).indexOf(
            this.element
        );
        this.element.style.position = "absolute";
        this.element.style.transform = "none";
        document.body.appendChild(this.element);

        this.moveToPosition(event.clientX + window.scrollX, event.clientY + window.scrollY);

        if (this.dragBeginCallback) {
            this.dragBeginCallback();
        }
    }

    dragMouseMove(event) {
        // If not left click, do nothing
        if (event.which != 1) {
            return;
        }
        event.preventDefault();
        // console.log(`${event.clientX} ${event.clientY}`);

        this.moveToPosition(event.clientX + window.scrollX, event.clientY + window.scrollY);
    }

    dragMouseUp(event) {
        console.log("Drag ended!!!");
        // If not left click, do nothing
        if (event.which != 1) {
            return;
        }

        this.dragging = false;

        event.preventDefault();

        document.removeEventListener("mouseup", this.dragMouseUp);
        document.removeEventListener("mousemove", this.dragMouseMove);
        this.element.style.top = null;
        this.element.style.left = null;
        this.element.style.position = null;
        this.element.style.transform = null;

        const mouseX = event.clientX;
        const mouseY = event.clientY;

        let parented = false;

        for (const container of this.containers) {
            const rect = container.getBoundingClientRect();
            // console.log(rect);
            // console.log(mouseX > parseInt(rect.left, 10));
            // console.log(mouseX < parseInt(rect.right, 10));
            // console.log(mouseY > parseInt(rect.top, 10));
            // console.log(mouseY < parseInt(rect.bottom, 10));

            if (
                mouseX > parseInt(rect.left, 10) &&
                mouseX < parseInt(rect.right, 10) &&
                mouseY > parseInt(rect.top, 10) &&
                mouseY < parseInt(rect.bottom, 10)
            ) {
                container.appendChild(this.element);
                console.log("Appended!!");
                this.parent = this.element.parentElement;
                parented = true;
                if (this.dragEndCallback) {
                    this.dragEndCallback(this.parent);
                }
                break;
            }
        }
        if (!parented) {
            this.cancelDrag();
        }
    }

    cancelDrag() {
        this.dragging = false;
        this.element.style.top = null;
        this.element.style.left = null;
        this.element.style.position = null;
        this.element.style.transform = null;
        this.parent.insertBefore(
            this.element,
            this.parent.children[this.childIndex]
        );
        if (this.dragEndCallback) {
            this.dragEndCallback(this.parent);
        }
    }

    setDragBeginCallback(func) {
        this.dragBeginCallback = func;
    }

    setDragEndCallback(func) {
        this.dragEndCallback = func;
    }

    destroy() {
        this.element.removeEventListener("mousedown", this.dragMouseDown);
        document.removeEventListener("mouseup", this.dragMouseUp);
        document.removeEventListener("mousemove", this.dragMouseMove);
        if (this.dragging) {
            this.cancelDrag();
        }
    }
}

class UnoGameRenderer {
    constructor(drawContainer, playContainer) {
        this.drawContainer = drawContainer;
        this.playContainer = playContainer;
        this.handContainers = {};
        this.displayNames = {};
    }

    addPlayer(user, handWrapper) {
        const userId = user.player_id;
        this.handContainers[userId] = handWrapper.querySelector(".unoHand");
        this.displayNames[userId] = handWrapper.querySelector(".playerName");
    }

    updateHand(playerId, cardCollection) {
        // If player not in game, don't render
        if (!this.handContainers[playerId]) {
            return;
        }

        // Empty the container
        this.handContainers[playerId].innerHTML = "";

        // Loop through cards and render
        cardCollection.forEach((cardData, index) => {
            const card = this.#generate_card(cardData);

            // Add the card to the hand and the handContainer
            this.handContainers[playerId].appendChild(card);
        });
    }

    // updateCurrentPlayer() {
    //     console.log(this.playerContainer);
    // }

    updateTopCard(cardData) {
        if (!cardData) {
            return;
        }
        // Destroy all but the top card
        this.playContainer.innerHTML = "";
        const newCard = this.#generate_card(cardData); // Generate card with card info
        this.playContainer.appendChild(newCard);
    }

    updateCurrentPlayer(playerId) {
        for (const [userId, container] of Object.entries(this.displayNames)) {
            container.classList.toggle("currentPlayer", userId == playerId)
        }
    }

    //* ************************** Card Templates */

    #generate_card(cardData) {
        let card;
        // Figure out what kind of card and render
        if (cardData.type === undefined) {
            card = this.#generate_flipped_card();
        } else if (cardData.color === "black") {
            card = this.#generate_wild_black(cardData.content === "wild");
        } else if (cardData.type == "NUMBER") {
            card = this.#generate_color_card(
                `num-${cardData.content}`,
                cardData.color
            );
        } else {
            card = this.#generate_color_card(cardData.content, cardData.color);
        }
        return card;
    }

    #generate_flipped_card = () => {
        const cardWrapper = document.createElement("div");
        cardWrapper.classList.add("cardWrapper");
        const unoCard = document.createElement("div");
        unoCard.classList.add("unoCard", "flipped");
        const shadow = document.createElement("div");
        shadow.classList.add("cardShadow");
        const inner = document.createElement("span");
        inner.classList.add("inner");
        const mark = document.createElement("span");
        mark.classList.add("mark");
        inner.append(mark);
        unoCard.append(inner);
        unoCard.append(shadow);
        cardWrapper.append(unoCard);
        return cardWrapper;
    };

    #generate_color_card = (value, color) => {
        const cardWrapper = document.createElement("div");
        cardWrapper.classList.add("cardWrapper");
        const unoCard = document.createElement("div");
        unoCard.classList.add("unoCard", value, color);
        const shadow = document.createElement("div");
        shadow.classList.add("cardShadow");
        const inner = document.createElement("span");
        inner.classList.add("inner");
        const mark = document.createElement("span");
        mark.classList.add("mark");
        inner.append(mark);
        unoCard.append(inner);
        unoCard.append(shadow);
        cardWrapper.append(unoCard);
        return cardWrapper;
    };

    #generate_wild_black = (is_wild /* or is_wildFour */) => {
        const cardWrapper = document.createElement("div");
        cardWrapper.classList.add("cardWrapper");
        const unoCard = document.createElement("div");
        unoCard.classList.add(
            "unoCard",
            is_wild ? "wild" : "wildFour",
            "black"
        );
        const shadow = document.createElement("div");
        shadow.classList.add("cardShadow");
        const inner = document.createElement("span");
        inner.classList.add("inner");
        const wildMark = document.createElement("span");
        wildMark.classList.add(is_wild ? "wildMark" : "wildFourMark");

        // 4 colors
        const wildRed = document.createElement("div");
        wildRed.classList.add("wildRed", "wildCard");
        const wildBlue = document.createElement("div");
        wildBlue.classList.add("wildBlue", "wildCard");
        const wildYellow = document.createElement("div");
        wildYellow.classList.add("wildYellow", "wildCard");
        const wildGreen = document.createElement("div");
        wildGreen.classList.add("wildGreen", "wildCard");

        wildMark.append(wildRed);
        wildMark.append(wildBlue);
        wildMark.append(wildYellow);
        wildMark.append(wildGreen);
        inner.append(wildMark);
        unoCard.append(shadow);
        unoCard.append(inner);
        cardWrapper.append(unoCard);
        return cardWrapper;
    };
}

/**
 * TurnController is used to start or end a turn.
 */
class TurnController {
    constructor(drawContainer, playContainer, handContainer, gameWindow) {
        this.drawContainer = drawContainer;
        this.playContainer = playContainer;
        this.handContainer = handContainer;
        this.gameWindow = gameWindow;
        this.draggables = [];
        this.drawCard = document.getElementById("drawCard");

        const draggable = new Draggable(
            drawCard,
            [this.handContainer],
            this.gameWindow
        );
        draggable.setDragEndCallback(async (newParent) => {
            if (newParent == this.handContainer) {
                this.drawContainer.appendChild(drawCard);

                console.log("Drawing a card!!!");
                const result = await axios.get(`/game/${getGameId()}/drawCard`);

                console.log(result);

                this.endTurn();
            }
        });
        this.drawCard.toggleAttribute("disabled", true);
        // this.draggables.push(draggable);
        // another hacky way to add/remove event listeners
        // this.handleBlackCardAction = this.#handleBlackCardAction.bind(this);
        // this.removeBlackCardEvent = this.#removeBlackCardEvent.bind(this);
    }

    // note for callbacks that you want to use arrow functions for any form of callbacks if you're using this keyword
    startTurn(cardCollection, game_state) {
        this.endTurn();

        this.drawCard.toggleAttribute("disabled", false);

        cardCollection.forEach((cardData) => {
            // console.log(cardData); // card data last element has the discard card
            // console.log(cardData.collection_index);
            const card = this.handContainer.children.item(
                cardData.collection_index
            );
            const draggable = new Draggable(
                card,
                [this.playContainer],
                this.gameWindow
            );
            // kill the animation
            draggable.setDragBeginCallback(async () => {
                // kill card bounce
                removeBounceAnimation(card);
                for (const [idx, reapplyCard] of Object.entries(
                    this.handContainer.children
                )) {
                    removeBounceAnimation(reapplyCard);
                }
            });

            // restart the animation
            draggable.setDragEndCallback(async (newParent) => {
                // console.log(cardData.collection_index);
                // console.log(game_state);
                // console.log(cardCollection);
                if (newParent == this.playContainer) {
                    // if card is a wild card, prompt with modal and request the move
                    // console.log(cardData);

                    // this.#animateCardPing(this.playContainer);
                    if (cardData.color == "black") {
                        // Modal!
                        // this.handleBlackCardAction(cardData);
                        this.#handleBlackCardAction(cardData).then((res) => {
                            this.#animateCardPing(this.playContainer);
                        });
                    } else {
                        // Make move request
                        // const moveResult = await axios.post(`/game/${getGameId()}/move`, {cardData.collection_index}); //or however the heck it's named
                        console.log("Playing a card!");

                        console.log(
                            `collection_index: ${cardData.collection_index}`
                        );

                        // console.log(cardData.color);

                        const result = await axios.post(
                            `/game/${getGameId()}/playCard`,
                            {
                                collection_index: cardData.collection_index,
                            }
                        );

                        // console.log(result);
                        this.#animateCardPing(this.playContainer);
                        applyCurrentColorToGameScreen(cardData.color);
                    }

                    this.endTurn();
                } else {
                    for (const [idx, reapplyCard] of Object.entries(
                        this.handContainer.children
                    )) {
                        // removeBounceAnimation(reapplyCard);
                        applyBounceAnimation(
                            reapplyCard,
                            game_state.game,
                            cardCollection[idx]
                        );
                    }
                }
            });
            this.draggables.push(draggable);
            applyBounceAnimation(card, game_state.game, cardData);
        });

        document
            .getElementById("challenge")
            .toggleAttribute(
                "disabled",
                !game_state.game.is_challenge_available
            );

        // const drawCard = document.getElementById('drawCard');
        // const drawParent = drawCard.parentElement;
        /*
        const draggable = new Draggable(
            drawCard,
            [this.handContainer],
            this.gameWindow,
        );
        draggable.setDragEndCallback(async (newParent) => {
            if (newParent == this.handContainer) {
                drawParent.appendChild(drawCard);

                const result = await axios.get(`/game/${getGameId()}/drawCard`);

                console.log(result);

                this.endTurn();
            }
        });
        this.draggables.push(draggable);
        */
    }

    // clean up
    endTurn() {
        this.handContainer.childNodes.forEach((e) =>
            e.classList.remove("animate-bounce")
        );
        this.draggables.forEach((draggable) => {
            draggable.destroy();
        });
        this.draggables = [];
        this.drawCard.toggleAttribute("disabled", true);
        // document.getElementById("wildFourUserEvent").innerHTML = "";
    }

    #animateCardPing(playContainer) {
        setTimeout(() => {
            const cloneOfParent =
                playContainer.childNodes[
                    playContainer.childNodes.length - 1
                ].cloneNode(true);
            playContainer.append(cloneOfParent);
            cloneOfParent.classList.add("animate-ping");
            setTimeout(() => {
                // cloneOfParent.classList.remove("animate-ping");
                cloneOfParent.remove();
            }, 710);
        }, 100);
    }

    #handleBlackCardAction(cardData) {
        return new Promise((resolve, reject) => {
            const wildFourUserEvent =
                document.getElementById("wildFourUserEvent");
            const yellow = document.createElement("div");
            const green = document.createElement("div");
            const blue = document.createElement("div");
            const red = document.createElement("div");

            wildFourUserEvent.classList.add(
                "fixed",
                "z-10",
                "grid",
                "w-64",
                "h-64",
                "grid-cols-2",
                "gap-1",
                "bg-black",
                "rounded-lg",
                "custom-inset"
            );
            yellow.classList.add(
                "col-span-1",
                "mt-1",
                "ml-1",
                "bg-yellow-500",
                "hover:bg-yellow-700"
            );
            green.classList.add(
                "col-span-1",
                "mt-1",
                "mr-1",
                "bg-green-500",
                "hover:bg-green-700"
            );
            blue.classList.add(
                "col-span-1",
                "mb-1",
                "ml-1",
                "bg-blue-500",
                "hover:bg-blue-700"
            );
            red.classList.add(
                "col-span-1",
                "mb-1",
                "mr-1",
                "bg-red-500",
                "hover:bg-red-700"
            );

            yellow.id = "yellow";
            green.id = "green";
            blue.id = "blue";
            red.id = "red";

            wildFourUserEvent.append(yellow);
            wildFourUserEvent.append(green);
            wildFourUserEvent.append(blue);
            wildFourUserEvent.append(red);

            // wildFourUserEvent.classList.toggle("hidden", false);
            const colorSelectionChildren = document.querySelectorAll(
                "#wildFourUserEvent div"
            );
            for (const colorSelectedByID of colorSelectionChildren) {
                colorSelectedByID.addEventListener("click", async (e) => {
                    const selectedColor = e.target.getAttribute("id");
                    await axios
                        .post(`/game/${getGameId()}/playCard`, {
                            collection_index: cardData.collection_index,
                            color: selectedColor, // selected color
                        })
                        .then((res) => {
                            applyCurrentColorToGameScreen(selectedColor);
                            wildFourUserEvent.innerHTML = "";
                            wildFourUserEvent.classList.remove(
                                ...wildFourUserEvent.classList
                            );
                            resolve();
                        });
                    // wildFourUserEvent.classList.toggle("hidden", true);
                });
            }
        });
    }
}

// This class takes in a function and ensures that calls to that function execute synchronously
// Used to queue incoming game states
// Will be useful if we add animations later
class EventProcessor {
    constructor(processFunc) {
        this.processFunc = processFunc;
        this.queue = [];
        this.active = false;
        this.delay = 0;
    }

    // Call this function as if it's the function we passed to the constructor
    process() {
        this.queue.push(arguments);
        console.log(`Adding to queue, ${this.queue.length} items in queue`);
        this.#startQueue();
    }

    // Set delay in seconds
    setDelay(delay) {
        this.delay = delay * 1000;
    }

    #processEvent() {
        console.log(`${this.queue.length} events in queue`);
        const args = this.queue.shift();
        this.processFunc.apply(null, args);
        setTimeout(() => {
            if (this.queue.length > 0) {
                console.log(this.delay);
                this.#processEvent();
            } else {
                console.log("Inactive!");
                this.active = false;
            }
        }, this.delay);
    }

    #startQueue() {
        if (!this.active) {
            console.log("Active!");
            this.active = true;
            this.#processEvent();
        }
    }
}

let gameRenderer;
let turnController;

const playerMapping = new Map();
playerMapping.set(2, [0, 2]);
playerMapping.set(3, [0, 1, 3]);
playerMapping.set(4, [0, 1, 2, 3]);

// This function handles game states coming off of a queue
const gameStateProcessor = new EventProcessor(
    async (game_state, playersHand) => {
        const localPlayer = (await axios.get(`/game/${getGameId()}/getPlayer`))
            .data.player;

        const gameWindow = document.getElementById("game_window");
        const playerList = document.getElementById("list_of_players");

        // Display the proper panel depending on game state
        gameWindow.classList.toggle("invisible", !game_state.game.is_active);
        gameWindow.classList.toggle("hidden", !game_state.game.is_active);
        playerList.classList.toggle("invisible", game_state.game.is_active);
        playerList.classList.toggle("hidden", game_state.game.is_active);

        if (game_state.game.is_active) {
            if (gameRenderer == null) {
                const drawContainer =
                    document.getElementById("drawCard").parentElement;
                const playContainer = document.getElementById("discard");

                gameRenderer = new UnoGameRenderer(
                    drawContainer,
                    playContainer
                );

                turnController = new TurnController(
                    drawContainer,
                    playContainer,
                    document.getElementById("player0").querySelector(".unoHand"),
                    gameWindow
                );

                document
                    .getElementById("callUno")
                    .addEventListener("click", async () => {
                        await axios.post(`/game/${getGameId()}/uno`, {});
                    });

                document
                    .getElementById("challenge")
                    .addEventListener("click", async () => {
                        await axios.post(`/game/${getGameId()}/challenge`, {});
                    });

                const { players } = game_state;

                let offset = 0;

                players.forEach((player, index) => {
                    if (player.player_id === localPlayer.player_id) {
                        offset = index;
                    }
                });

                // placement of players based on how many
                const newPos = playerMapping.get(players.length);
                for (let i = 0; i < newPos.length; i++) {
                    const handContainerWrapper = document.getElementById(
                        `player${newPos[i]}`
                    )
                    const player = players[(i + offset) % players.length];
                    gameRenderer.addPlayer(player, handContainerWrapper);
                    
                    const nameTag = document.getElementById(
                        `player${newPos[i]}`
                    ).querySelector(".playerName");
                    nameTag.innerHTML = player.display_name;
                }
            }

            game_state.players.forEach((player) => {
                if (player.player_id == localPlayer.player_id) {
                    gameRenderer.updateHand(
                        player.player_id,
                        playersHand.data.collection // eric added this for all cards
                    );
                } else {
                    gameRenderer.updateHand(
                        player.player_id,
                        player.collection // eric added this for all cards
                    );
                }
            });

            if (game_state.collection_play.length > 0) {
                gameRenderer.updateTopCard(
                    game_state.collection_play[
                        game_state.collection_play.length - 1
                    ]
                );
            }

            gameRenderer.updateCurrentPlayer(game_state.game.player_id_turn);

            document
                .getElementById("callUno")
                .toggleAttribute("disabled", !game_state.game.is_uno_available);
            document
                .getElementById("challenge")
                .toggleAttribute("disabled", true);

            // If its my turn
            // make my cards draggable loop
            // draggable for this card, disconnect all others upon callback
            // callback is if card is black, modal, then request
            // else request
            // if (game_state.player_id_turn === localPlayer.player_id) {

            // }
            // pass also the current player at the start of turn so we can display that current player
            // console.log(game_state.game.player_id_turn);

            const findPlayer = game_state.players.find((player) => {
                console.log(
                    `${player} ${player.player_id} ${game_state.game.player_id_turn}`
                );
                return player.player_id === game_state.game.player_id_turn;
            });

            console.log(`Found player: ${findPlayer}`);

            if (findPlayer !== undefined) {
                display_current_player(findPlayer.display_name);
            }
            document.getElementById("is_reverse").innerHTML = `Direction: ${
                game_state.game.is_clockwise ? "Clockwise" : "Counter Clockwise"
            }`;
            if (game_state.game.draw_amount !== 0) {
                document.getElementById(
                    "draw_amount"
                ).innerHTML = `Draw amount: ${game_state.game.draw_amount}`;
            }
            if (game_state.game.player_id_turn == localPlayer.player_id) {
                turnController.startTurn(
                    playersHand.data.collection,
                    game_state // discard pile
                );
            }
            if (game_state.game.card_color_legal) {
                applyCurrentColorToGameScreen(game_state.game.card_color_legal);
            }
        }
        forceScrollDown();
    }
);

gameStateProcessor.setDelay(0.25);

// This function takes incoming game_states and shoves them into a queue to be processed synchronously
async function renderGameState(game_state) {
    console.log(
        "%cserver-game-game-id-game-state",
        "color: black;background-color:lawngreen;font-size: 20px;"
    );
    console.log(game_state);

    // Ohhh this is gonna cause problems potentially. Maybe.
    const playersHand = await axios.get(`/game/${getGameId()}/getHand`);

    gameStateProcessor.process(game_state, playersHand);
}

const forceScrollDown = () => {
    document.querySelector("#sandbox_message_box").scrollTop =
        document.querySelector("#sandbox_message_box").scrollHeight;
};

const display_current_player = (display_name) => {
    const currentPlayerTarget = document.getElementById("currentPlayer");
    currentPlayerTarget.textContent = `Current Player: ${display_name}`;
};

const applyCurrentColorToGameScreen = async (color) => {
    const currentColor = document.getElementById("currentColor");
    for (let i = 0; i < currentColor.classList.length; i++) {
        if (currentColor.classList[i].match(/bg-\S+-\d+/)) {
            currentColor.classList.remove(currentColor.classList[i]);
        }
    }
    currentColor.classList.add(`bg-${color}-500`);
};

const applyBounceAnimation = (card, game, cardData) => {
    if (game.draw_amount > 1) {
        if (cardData.content === game.card_content_legal) {
            card.classList.add("animate-bounce");
        } else {
            card.classList.add("brightness-75");
            card.toggleAttribute("disabled", true); // ERIC, added disabled as well.

            card.addEventListener("mousedown", (e) => {
                shakeCard(card);
            });
        }
    } else if (cardData.color === game.card_color_legal) {
        card.classList.add("animate-bounce");
    } else if (cardData.content === game.card_content_legal) {
        card.classList.add("animate-bounce");
    } else if (cardData.color === "black") {
        card.classList.add("animate-bounce");
    } else {
        card.classList.add("brightness-75");
        card.toggleAttribute("disabled", true); // ERIC, added disabled as well.

        card.addEventListener("mousedown", (e) => {
            shakeCard(card);
        });
    }
};

const shakeCard = (card) => {
    card.classList.add("apply-shake");
    setTimeout(() => {
        card.classList.remove("apply-shake");
    }, 300);
};

const removeBounceAnimation = (card) => {
    card.classList.remove("animate-bounce");
};
const endGameDisplayer = (object) => {
    if (object.player) {
        const endGameFlashMessage = document.getElementById(
            "endGameFlashMessage"
        );
        endGameFlashMessage.innerHTML = `
            <div class="alert alert-danger">
                <h2 class="top-10 font-semibold bg-gradient-to-r bg-clip-text text-transparent 
                from-red-500 via-blue-500 to-green-500
                ">The Winner is <span class="font-bold">${object.player.display_name}</span>!!!</h2>
            </div>`;
        endGameFlashMessage.style.visibility = "visible";
        setTimeout(() => {
            window.location.pathname = object.url;
        }, 3000);
    } else {
        setTimeout(() => {
            window.location.pathname = object.url;
        }, 500);
    }
};

async function setup() {
    // Set up a listener for future incoming game states (the next incoming state could be several seconds/minutes away)
    socket.on("server-game-game-id-game-state", renderGameState);
    socket.on("server-game-game-id-object", (object) => {
        endGameDisplayer(object);
    });
    document.getElementById("endGameFlashMessage").innerHTML = "";
    // Request the game state right now because we need one now
    const gameState = (await axios.get(`/game/${getGameId()}/getGameState`))
        .data;

    // Manually force a rerender
    renderGameState(gameState);
}

// Wait for the window to load so we have the DOM and access to socket from a script that loads later than this one
window.addEventListener("load", setup);

// This is not as widely supported as window.onload
// document.addEventListener("DOMContentLoaded", setup);
