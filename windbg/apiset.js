'use strict';

const is_kd = _ => host.currentSession.Attributes.Target.IsKernelTarget;
const chunk = ([a1, a2, ...tail]) => tail.length // LE
          ? [[a1, a2].reverse(), ...chunk(tail)] : [[a1, a2].reverse()];
/*
 * All fields of API_SET_* structures have an equal size, so we simply read
 * the necessary values in series (imitates the dump of structure). Instead
 * of defining synthetic types, this trick seems more pretty and simple.
 */
const read_struct = (arr, adr) => {
  return ((fields, values) => { // instead synthetic types
    return fields.reduce((hash, key, index) => {
      hash[key] = values[index];
      return hash;
    }, {});
  })(arr, host.memory.readMemoryValues(adr, arr.length, 4));
}, read_string = (adr, len) => {
  return String.fromCharCode(...chunk( // parse Unicode charaters
    host.memory.readMemoryValues(adr, len, 1)
  ).map(c => c.join('').padStart(4, '0')));
};

const log = x => host.diagnostics.debugLog(`${x}\n`);
const pnt = (x, y) => host.createPointerObject(x, 'nt', `_${y} *`);

class ApiSetEntry {
  constructor(entry, sealed, points) {
    this.Entry = entry;
    this.Sealed = sealed;
    this.Points = points;
  }
}
/*
 * Uasge: .scriptload apiset.js
 *        dx -g @$apiset()
 *        [...] <- clickable in WinDbg
 *        dx -c 100 -g @$apiset()
 *        [...]
 *        dx -c 200 -g @$apiset()
 *        [...]
 *        and so on
 */
function *GetApiSetEntries() {
  try {
    let adr = ((_ => {return is_kd() ? pnt(host.currentProcess.KernelObject.Peb.address, 'PEB')
            : host.namespace.Debugger.State.PseudoRegisters.General.peb})()).ApiSetMap.address,
        api_set_namespace = read_struct([ // sizeof(API_SET_NAMESPACE) = 0x1C
          'Version', 'Size', 'Flags', 'Count', 'EntryOffset', 'HashOffset', 'HashFactor'
        ], adr);
    for (let pasne = adr.add(api_set_namespace.EntryOffset),
             ofs_v = 0, i = 0; i < api_set_namespace.Count; ofs_v += 0x18, i++) {
      let entry = read_struct([ // sizeof(API_SET_NAMESPACE_ENTRY) = 0x18
        'Flags', 'NameOffset', 'NameLength', 'HashedLength', 'ValueOffset', 'ValueCount'
      ], pasne.add(ofs_v));

      let name = read_string(adr.add(entry.NameOffset), entry.NameLength),
          stat = 0 !== (entry.Flags & 0x01) ? 'true' : 'false',
          vals = [];

      for (let pasve = adr.add(entry.ValueOffset),
               ofs_e = 0, j = 0; j < entry.ValueCount; ofs_e += 0x14, j++) {
        let value = read_struct([ // sizeof(API_SET_VALUE_ENTRY) = 0x14
          'Flags', 'NameOffset', 'NameLength', 'ValueOffset', 'ValueLength'
        ], pasve.add(ofs_e));
        vals.push(read_string(adr.add(value.ValueOffset), value.ValueLength));
      }

      yield new ApiSetEntry(name, stat, vals);
    }
  }
  catch (e) {
    log(`WARNING: ${e.message}, check debug environment.`);
  }
}

function initializeScript() {
  return [new host.functionAlias(GetApiSetEntries, 'apiset')];
}
