const color_map = {
    off: '0x00',
    yellow: '0x15',
    red: '0x63',
    green: '0x60',
};
import animals from '../data/animals.json' with { type: 'json' };

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function preloadSounds(animalSounds) {
    const audioMap = {};
    let loadedCount = 0;

    return new Promise((resolve, reject) => {
        animalSounds.forEach(item => {
            const audio = new Audio();
            audio.src = item.soundFilePath;
            audio.preload = "auto";

            audio.addEventListener("canplaythrough", () => {
                loadedCount++;
                audioMap[item.animal] = audio;

                if (loadedCount === animalSounds.length) {
                    resolve(audioMap);
                }
            });

            audio.addEventListener("error", () => {
                reject(new Error(`Failed to load sound: ${item.soundFilePath}`));
            });
        });
    });
}

const state_map = {
    unknown: color_map.yellow,
    active: color_map.red,
    correct: color_map.green,
    wrong: color_map.red,
    done: color_map.off
}

const note_off = '0x0';
const note_on = '0x7f';


function Game(output, input) {
    this.output = output;
    this.input = input;
    this.grid = [];
    this.player1 = { buttons: [], points: 0, picks: 0 };
    this.player2 = { buttons: [], points: 0, picks: 0 };
    this.af = null;
    this.current_turn = '';
    this.active_cell = {};
    this.random_animals = [];
    this.animal_sounds = [];

    this.onMidiMessage = (event) => {
        let event_msg = []
        for (const character of event.data) {
            let msg = `0x${character.toString(16)}`;
            event_msg.push(msg);
        }

        if (event_msg[2] === note_off ) {
            console.log(event_msg, this.current_turn);

            this.updateCell(event_msg[1]);
            this.handlePlayerPicks();
        }

    }
    this.input.onmidimessage = this.onMidiMessage;

    this.updateCell = (cell) => {
        //console.log(cell, this.grid)
        let cell_id = this.grid.findIndex((x, i) => x.addr === cell);
        console.log(cell_id, this.grid[cell_id].value);

        if (cell_id !== -1) {
            if (this.grid[cell_id].state !== color_map.off) {
                this.grid[cell_id].state = state_map.active;
                this.animal_sounds[this.grid[cell_id].value].play();
                //console.log(this.grid[cell_id]);

                if (this[this.current_turn].picks === 0) {
                    this.active_cell = cell_id;
                } else {
                    //debugger
                    if (this.grid[cell_id].value === this.grid[this.active_cell].value) {
                        this[this.current_turn].points++;
                        //this[this.current_turn].picks = 0; // we go again
                        this.grid[cell_id].state = color_map.off;
                        this.grid[this.active_cell].state = color_map.off;
                        // win
                    } else {
                        this.grid[cell_id].state = color_map.yellow;
                        this.grid[this.active_cell].state = color_map.yellow;
                        // womp womp
                    }
                    this.active_cell = null;
                }
            } // else we ignore, it's been played
        }

    };

    this.handlePlayerPicks = () => {
        if (this[this.current_turn].picks < 1) {
            this[this.current_turn].picks++;
        } else if(this[this.current_turn].picks === 1) {
            this[this.current_turn].picks = 0;
            this.current_turn = this.current_turn === 'player1' ? 'player2' : 'player1';
        }
    }

    this.init_grid = () => {
        let grid = [];
        let counter = 0;

        for (let i = 0; i <= 7; i++) {
            for (let j = 0; j <= 7; j++) {
                grid.push({ addr: `0x${i === 0? '' : i}${j}`,
                            state: state_map.unknown,
                            value: this.random_animals[counter].animal });
                counter++;
            }
        }
        //console.log(grid);
        this.grid = grid;
    };

    this.init_players = () => {
        this.player1 = { buttons: [], points: 0, picks: 0 };
        this.player2 = { buttons: [], points: 0, picks: 0 };
        // player button addresses are a bit weird...

        let count_up = [68, 69, '6a', '6b', '6c', '6d', '6e', '6f'];
        for (let i = 0; i <= 7; i++) {
            this.player1.buttons.push({ addr: `0x${count_up[i]}`});
        }

        for (let i = 0; i <= 7; i++) {
            this.player2.buttons.push({ addr: `0x${i}8`});
        }
    };

    this.start_game = async () => {
        //console.log(animals)
        this.random_animals = shuffleArray(animals.concat(animals));
        this.animal_sounds = await preloadSounds(animals);

        this.init_grid();
        this.init_players();
        this.drawGrid();

        this.current_turn = 'player1';
        this.af = window.requestAnimationFrame(this.gameloop);
        this.gameloop();
    };
    this.gameloop = (dt) => {
        //this.reset();

        this.drawPlayerPoints('player1');
        this.drawPlayerPoints('player2');
        this.drawGrid();

        this.af = window.requestAnimationFrame(this.gameloop);
    };

    this.drawPlayerPoints = (player) => {
        let draw_function = player === "player1" ? 'color_msg_player1' : 'color_msg';

        this[player].buttons.forEach(x => {
            this.output.send(this[draw_function](x.addr, color_map.off));
        })

        this[player].buttons.forEach((elem, index) => {
            if (index < this[player].points) {
                this.output.send(this[draw_function](this[player].buttons[index].addr, color_map.red));
            }

            if (index == this[player].points && this.current_turn === player) {
                this.output.send(this[draw_function](this[player].buttons[index].addr, color_map.green));
            }
        })
    };

    this.reset = () => {
        this.grid.forEach(x => {
             this.output.send(this.color_msg(x.addr, color_map.off));
        });
        this.player1.buttons.forEach(x => {
            this.output.send(this.color_msg_player1(x.addr, color_map.off));
        })
        this.player2.buttons.forEach(x => {
            this.output.send(this.color_msg(x.addr, color_map.off));
        })
    };

    this.drawGrid = () => {
        this.grid.forEach((x, i) => {
            this.output.send(this.color_msg(x.addr, x.state));
        });
    };

    this.color_msg = (addr, color) => {
        return ['0x90', `${addr}`, `${color}`];
    }
    this.color_msg_player1 = (addr, color) => {
        return ['0xb0', `${addr}`, `${color}`];
    }
}


export { Game };
