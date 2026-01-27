const color_map = {
    off: '0x0c',
    yellow: '0x3e',
    red: '0x0f',
    green: '0x3c',
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
            audio.src = item.soundFilePath + "#t=0,3";
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

    this.onMidiMessage = (event) => {
        let event_msg = []
        for (const character of event.data) {
            let msg = `0x${character.toString(16)}`;
            event_msg.push(msg);
        }

        if (event_msg[2] === note_off ) {
            console.log(this.current_turn, "presses", event_msg);

            this.update(event_msg[1]);
            this.handlePlayerPicks();
        }
    }
    this.input.onmidimessage = this.onMidiMessage;

    this.update = (cell) => {
        let cell_id = this.grid.findIndex((x, i) => x.addr === cell);
        console.log("Pressed cell with id", cell_id, "and value", this.grid[cell_id].value);

        if (cell_id !== -1) {
            if (this.grid[cell_id].state !== color_map.off) {
                this.grid[cell_id].state = color_map.red;
                this.animal_sounds[this.grid[cell_id].value].play();
                //console.log(this.grid[cell_id]);

                if (this[this.current_turn].picks === 0) {
                    this.active_cell = cell_id;
                } else {
                    //debugger
                    if (this.grid[cell_id].value === this.grid[this.active_cell].value && cell_id !== this.active_cell) {
                        // win
                        this[this.current_turn].points++;
                        this.grid[cell_id].state = color_map.off;
                        this.grid[this.active_cell].state = color_map.off;
                    } else {
                        // womp womp
                        this.grid[cell_id].state = color_map.yellow;
                        this.grid[this.active_cell].state = color_map.yellow;
                    }
                    this.active_cell = null;
                }
            } // else we ignore, it's been played
        }

        this.drawGrid();
        this.drawPlayerPoints('player1');
        this.drawPlayerPoints('player2');
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

        for (let i = 0; i <= 7; i++) {
            for (let j = 0; j <= 7; j++) {
                grid.push({ addr: `0x${i === 0? '' : i}${j}`,
                            state: color_map.yellow,
                            value: this.random_animals[i * 8 + j].animal });
            }
        }
        //console.log(grid);
        this.grid = grid;
    };

    this.start_game = async () => {
        //console.log(animals)
        this.random_animals = shuffleArray(animals.concat(animals));
        this.animal_sounds = await preloadSounds(animals);

        console.log(this.animal_sounds)

        this.init_grid();
        this.drawGrid();

        this.current_turn = 'player1';
        
        this.drawPlayerPoints('player1');
        this.drawPlayerPoints('player2');
    };

    this.drawPlayerPoints = (player) => {
        let draw_function = player === "player1" ? 'color_msg_player1' : 'color_msg';

        this[player].buttons.forEach(x => {
            this.output.send(this[draw_function](x, color_map.off));
        })

        this[player].buttons.forEach((elem, index) => {
            if (index < this[player].points) {
                this.output.send(this[draw_function](this[player].buttons[index], color_map.red));
            }

            if (index == this[player].points && this.current_turn === player) {
                this.output.send(this[draw_function](this[player].buttons[index], color_map.green));
            }
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
