'use strict';

const log = x => host.diagnostics.debugLog(`${x}\n`);
const sym = x => host.getModuleSymbolAddress('fltmgr', x);
const pnt = (x, y) => host.createPointerObject(x, 'fltmgr', `_${y} *`);
const lst = (x, y, z) => host.namespace.Debugger.Utility.Collections.FromListEntry(x, `fltmgr!_${y}`, z);
/*
 * Usage: .scriptload ftldrv.js
 *        !fltdrv
 */
function GetFilterDrivers() {
  const globals = pnt(sym('FltGlobals'), 'GLOBALS');
  log(`Globals Address: ${globals.address}`);

  for (let frame of lst(globals.FrameList.rList, 'FLTP_FRAME', 'Links')) {
    log(`Frame ID: ${frame.FrameID}`);
    for (let fltr of lst(frame.RegisteredFilters.rList, 'FLT_FILTER', 'Base.PrimaryLink')) {
      log(`\tFilter ${fltr.Name}: ${fltr.address}`);
      for (let inst of lst(fltr.InstanceList.rList, 'FLT_INSTANCE', 'FilterLink')) {
        log(`\t\tInstance: ${inst.address}, Name: ${inst.Name}, Altitude: ${inst.Altitude}`);
      }
    }
  }
}

function initializeScript() {
  return [new host.functionAlias(GetFilterDrivers, 'fltdrv'),
    new host.apiVersionSupport(1, 6)
  ];
}
