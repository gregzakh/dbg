'use strict';

const log = x => host.diagnostics.debugLog(`${x}\n`);

class HDTable {
  constructor(name, address, point) {
    this.Name = name;
    this.Address = address;
    this.Point = point;
  }
}
/*
 * Usage: .scriptload hdt.js
 *        dx -g @$hdt()
 *
 * The HAL_DISPATCH  structure  is  a  table  of  pointers  to  optional
 * HAL functionality. This table initially  has  the  kernel's  built-in
 * implementations of most  (not all)  functions,  so if you want to see
 * more  than this, use something like next command:
 *
 * dx ((__int64*(*)[50])&nt!HalDispatchTable)->Select(x => (void(*)())x)
 */
function *ShowHalDispatchTable() {
  if (!host.currentSession.Attributes.Target.IsKernelTarget) {
    log('Error: requires kernel mode debugger environment.');
    return;
  }

  const table = host.createPointerObject(
    host.getModuleSymbolAddress('nt', 'HalDispatchTable'),
    'Wdf01000', 'HAL_DISPATCH *'
  );

  for (let x in table) {
    let type = typeof table[x]; // this check is a sieve for useless data
    if (type !== 'function' && type !== 'number') {
      yield new HDTable(x, table[x].address, table[x].ToDisplayString());
    }
  }
}

function initializeScript() {
  return [new host.functionAlias(ShowHalDispatchTable, 'hdt')];
}
