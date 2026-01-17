import midi_connect from './modules/midi.js';
import { Game } from './modules/launchpad.js';


//let midi, input, output = null;
const controller_name = "Launchpad Mini";

document.addEventListener('DOMContentLoaded', async () => {
  //console.log(`loaded ${ Date.now()}`);

  let [midi, input, output] = await midi_connect(controller_name);
  console.log(input);

  //game.start_game(output);
  let game = new Game(output, input);
  console.log(game)
  game.start_game();
});
