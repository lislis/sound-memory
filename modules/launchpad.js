import animals from '../data/animals_local.json' with { type: 'json' };
import { shuffleArray, preloadSounds } from './util.js';

const color_map = {
    off: '0x0c',
    yellow: '0x3e', //0x3e
    amber: '0x3f',
    red: '0x0f',
    green: '0x3c',
};

const note_off = '0x0';

function Game(output, input) {
    this.output = output;
    this.input = input;
    this.grid = [];
    this.player1 = { buttons: ['0x68', '0x69', '0x6a', '0x6b', '0x6c', '0x6d', '0x6e', '0x6f'], points: 0, picks: 0 };
    this.player2 = { buttons: ['0x08', '0x18', '0x28', '0x38', '0x48', '0x58', '0x68', '0x78'], points: 0, picks: 0 };
    this.current_turn = '';
    this.active_cell = null;
    this.random_animals = [];
    this.animal_sounds = [];
    this.gameover = false;

    this.onMidiMessage = (event) => {
        let event_msg = []
        for (const character of event.data) {
            let msg = `0x${character.toString(16)}`;
            event_msg.push(msg);
        }

        if (event_msg[2] === note_off ) {
            console.log(this.current_turn, "presses", event_msg);
            if (!this.gameover) {
                this.update(event_msg[1]);
            } else {
                console.log("GAME OVER, refresh browser")
            }
        }
    }
    this.input.onmidimessage = this.onMidiMessage;

    this.update = (cell) => {
        let cell_id = this.gridCellValid(cell);
        if (cell_id) {
            console.log("Pressed cell with id", cell_id, "and value", this.grid[cell_id].value);

            // let the last player's two picks stay
            // until it's the current player's first pick
            if (!this.active_cell && this[this.current_turn].picks === 0) {
                this.clearGrid();
            }

            this.grid[cell_id].state = color_map.red;
            this.animal_sounds[this.grid[cell_id].value].play();

            if (this[this.current_turn].picks === 0) {
                this.active_cell = cell_id;
            } else {
                if (this.grid[cell_id].value === this.grid[this.active_cell].value
                    && cell_id !== this.active_cell) {
                    // win
                    this.increaseScoreCheckWin();
                    this.colorPicks(cell_id, color_map.green);
                } else {
                    // womp womp
                    this.colorPicks(cell_id, color_map.red);
                }
                this.active_cell = null;
            }

            this.handlePlayerPicks();
            this.drawGrid();
            this.drawPlayerPoints('player1');
            this.drawPlayerPoints('player2');
        }
    };

    this.increaseScoreCheckWin = () => {
        this[this.current_turn].points++;
        if (this[this.current_turn].points === 8) {
            this.gameover = true;
        }
    }

    this.colorPicks = (cell_id, color) => {
        this.grid[cell_id].state = color;
        this.grid[this.active_cell].state = color;
    }

    this.colorPlayerButtons = (player, draw_function, color) => {
        this[player].buttons.forEach(x => {
            this.output.send(this[draw_function](x, color));
        })

    }

    this.gridCellValid = (cell) => {
        let cell_id = this.grid.findIndex((x, i) => x.addr === cell);
        if (cell_id !== -1) {
            if (this.grid[cell_id].state !== color_map.off) {
                return cell_id
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    this.handlePlayerPicks = () => {
        if (this[this.current_turn].picks < 1) {
            this[this.current_turn].picks++;
        } else if(this[this.current_turn].picks === 1) {
            this[this.current_turn].picks = 0;
            this.current_turn = this.current_turn === 'player1' ? 'player2' : 'player1';
        }
    }

    // This is used to clear 'active picks' only when the players' turn switches
    this.clearGrid = () => {
        this.grid.forEach((x, i) => {
            if (x.state === color_map.red) {
                x.state = color_map.yellow;
            }
            if (x.state === color_map.green) {
                x.state = color_map.off;
            }
        });
    }

    this.init_grid = () => {
        let grid = [];

        for (let i = 0; i <= 7; i++) {
            for (let j = 0; j <= 7; j++) {
                grid.push({ addr: `0x${i === 0? '' : i}${j}`,
                            state: color_map.yellow,
                            value: this.random_animals[i * 8 + j].animal });
            }
        }
        this.grid = grid;
    };

    this.start_game = async () => {
        this.random_animals = shuffleArray(animals.concat(animals));
        this.animal_sounds = await preloadSounds(animals);

        this.init_grid();
        this.drawGrid();

        this.current_turn = 'player1';

        this.drawPlayerPoints('player1');
        this.drawPlayerPoints('player2');
    };

    this.drawPlayerPoints = (player) => {
        let draw_function = player === "player1" ? 'color_msg_player1' : 'color_msg';


        if (this.gameover && this[player].points === 8) {
            this.colorPlayerButtons(player, draw_function, color_map.green);
        } else {
            this.colorPlayerButtons(player, draw_function, color_map.off);

            this[player].buttons.forEach((elem, index) => {
                if (index < this[player].points) {
                    this.output.send(this[draw_function](this[player].buttons[index], color_map.red));
                }

                if (index == this[player].points && this.current_turn === player) {
                    this.output.send(this[draw_function](this[player].buttons[index], color_map.green));
                }
            })
        }

    };

    this.drawGrid = () => {
        if (this.gameover) {
            this.grid.forEach((x, i) => {
                this.output.send(this.color_msg(x.addr, color_map.off));
            });
        } else {
            this.grid.forEach((x, i) => {
                this.output.send(this.color_msg(x.addr, x.state));
            });
        }

    };

    this.color_msg = (addr, color) => {
        return ['0x90', `${addr}`, `${color}`];
    }
    this.color_msg_player1 = (addr, color) => {
        return ['0xb0', `${addr}`, `${color}`];
    }
}


export { Game };
