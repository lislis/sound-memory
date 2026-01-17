import midi_connect from './modules/midi.js';


//let midi, input, output = null;
const controller_name = "Launchpad Mini";

document.addEventListener('DOMContentLoaded', async () => {
  console.log(`loaded ${ Date.now()}`);

  let [midi, input, output] = await midi_connect(controller_name);

  console.log(input);

});
