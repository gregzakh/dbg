'use strict';

const log = x => host.diagnostics.debugLog(`${x}\n`);
/*
 * Usage: .scriptload clockres.js
 *        !clockres
 */
function GetSystemTimerResolution() {
  if (!host.currentSession.Attributes.Target.IsKernelTarget) {
    log('Error: requires kernel mode debugger environment.');
    return;
  }

  ['Maximum', 'Minimum', 'Current'].forEach(x => {
    let value = host.createPointerObject(
      host.getModuleSymbolAddress(
        'nt', `Ke${"Current" === x ? "Time" : x}Increment`
      ), 'nt', 'unsigned long *'
    )[0];
    log(`${x} timer interval: ${parseFloat(value / 10000)} ms`);
  });
}

function initializeScript() {
  return [new host.functionAlias(GetSystemTimerResolution, 'clockres')];
}
