'use strict';

const log = x => host.diagnostics.debugLog(`${x}\n`);
const pnt = (x, y) => host.createPointerObject(x, 'nt', `_${y} *`);
const cmd = x => host.namespace.Debugger.Utility.Control.ExecuteCommand(x);
/*
 * Usage: .scriptload bootcount.js
 *        !bootcount
 * Be warned that there are some reasons not to trust return values, usually
 * depending on the debugger environment.  Do not use this script unless you
 * are sure of the final data values.
 */
function *GetBootCounters() {
  const node = '\\REGISTRY\\MACHINE\\SYSTEM\\ControlSet001\\Control' +
           '\\Session Manager\\Memory Management\\PrefetchParameters';
  let success = 0; // successful boots
  for (let x of cmd(`!reg q ${node}`)) {
    if (/bootid/i.test(x)) {
      success = parseInt(x.match(/\d+$/));
      break;
    }
  }
  const kusr = host.currentSession.Attributes.Target.IsKernelTarget ?
                                     0xFFFFF78000000000 : 0x7FFE0000;
  let total = pnt(kusr, 'KUSER_SHARED_DATA').BootId;
  log(`Total system boot tries  : ${total}\nNumber of boot completed : ${success}`);
  log(`Total failed boot count  : ${total - success}`);
}

function initializeScript() {
  return [new host.functionAlias(GetBootCounters, 'bootcount')];
}
