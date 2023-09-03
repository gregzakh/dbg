'use strict';

const log = x => host.diagnostics.debugLog(`${x}\n`);
const cmd = x => host.namespace.Debugger.Utility.Control.ExecuteCommand(`!reg q ${x}`);
/*
 * Usage: .scriptload ipreg.js
 *        !ipreg
 */
function *GetIpAddress() {
  if (!host.currentSession.Attributes.Target.IsKernelTarget) {
    log('Error: requires kernel mode debugger environment.');
    return;
  }

  const nodes = [
    '\\REGISTRY\\MACHINE',
    '\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\NetworkCards\\',
    '\\SYSTEM\\ControlSet001\\Services\\Tcpip\\Parameters\\Interfaces\\'
  ];

  let index = cmd(`${nodes[0]}${nodes[1]}`).Where(x => /\s\d$/.test(x)
                    ).Select(x => { return {Index: x.match(/\d$/)} });
  for (let card of index) {
    let guid = (cmd(`${nodes[0]}${nodes[1]}${card.Index}`).Where(
                x => /servicename/i.test(x)).First().match(/\{.+\}/));
    let addr = cmd(`${nodes[0]}${nodes[2]}${guid}`).Where(
                                      x => /dhcpip/i.test(x)).First();
    log(`${guid} : ${addr.match(/((\d+\.){3}\d+)/)[1]}`);
  }
}

function initializeScript() {
  return [new host.functionAlias(GetIpAddress, 'ipreg')];
}
